import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';

// WebSocket Service for Real-time Features
export class WebSocketService {
  private static io: SocketIOServer;
  private static connectedClients: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds
  private static conversationRooms: Map<string, Set<string>> = new Map(); // conversationId -> Set of socketIds

  /**
   * Initialize WebSocket server
   */
  static initialize(httpServer: HTTPServer) {
    const rawCors = process.env.CORS_ORIGINS;
    const allowedOrigins = rawCors
      ? rawCors.split(',').map((o) => o.trim()).filter(Boolean)
      : [
          process.env.FRONTEND_URL || 'http://localhost:3001',
          'http://localhost:3000',
          'http://localhost:5173',
          'http://127.0.0.1:3001',
          'http://127.0.0.1:5173',
        ];

    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      pingInterval: 25000,
      pingTimeout: 60000
    });

    const getJwtSecret = (): string => {
      const secret = process.env.JWT_SECRET;
      if (!secret && process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET is required in production');
      }
      return secret || 'dev-jwt-secret-do-not-use-in-prod-32chars';
    };

    // ISS-008: Handshake JWT authentication middleware
    this.io.use((socket, next) => {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers?.authorization?.startsWith('Bearer ')
          ? socket.handshake.headers.authorization.slice(7)
          : null);

      if (token) {
        try {
          const decoded = jwt.verify(token, getJwtSecret()) as any;
          const userId = decoded.userId || decoded.id;
          if (userId) {
            socket.data.userId = userId;
            if (!WebSocketService.connectedClients.has(userId)) {
              WebSocketService.connectedClients.set(userId, new Set());
            }
            WebSocketService.connectedClients.get(userId)!.add(socket.id);
            socket.join(`user:${userId}`);
            console.log('[WebSocket] Client authenticated via handshake:', userId);
          }
        } catch (err) {
          console.warn('[WebSocket] Handshake auth token invalid, proceeding unauthenticated:', (err as any)?.message);
        }
      }
      next();
    });

    this.io.on('connection', (socket) => {
      console.log('[WebSocket] Client connected:', socket.id);

      // Authentication middleware
      socket.on('authenticate', async (token: string) => {
        try {
          const decoded = jwt.verify(token, getJwtSecret()) as any;
          const userId = decoded.userId || decoded.id;
          
          if (userId) {
            socket.data.userId = userId;
            
            // Add to connected clients
            if (!this.connectedClients.has(userId)) {
              this.connectedClients.set(userId, new Set());
            }
            this.connectedClients.get(userId)!.add(socket.id);
            
            // Join user's personal room
            socket.join(`user:${userId}`);
            
            console.log('[WebSocket] User authenticated:', userId);
            socket.emit('authenticated', { success: true, userId });
          } else {
            socket.emit('authenticated', { success: false, error: 'Invalid token' });
          }
        } catch (error) {
          console.error('[WebSocket] Authentication error:', error);
          socket.emit('authenticated', { success: false, error: 'Authentication failed' });
        }
      });

      // Join conversation room
      socket.on('join_conversation', (conversationId: string) => {
        try {
          socket.join(`conversation:${conversationId}`);
          
          if (!this.conversationRooms.has(conversationId)) {
            this.conversationRooms.set(conversationId, new Set());
          }
          this.conversationRooms.get(conversationId)!.add(socket.id);
          
          console.log('[WebSocket] Socket joined conversation:', conversationId);
          socket.emit('joined_conversation', { conversationId });
        } catch (error) {
          console.error('[WebSocket] Error joining conversation:', error);
        }
      });

      // Leave conversation room
      socket.on('leave_conversation', (conversationId: string) => {
        try {
          socket.leave(`conversation:${conversationId}`);
          
          const room = this.conversationRooms.get(conversationId);
          if (room) {
            room.delete(socket.id);
            if (room.size === 0) {
              this.conversationRooms.delete(conversationId);
            }
          }
          
          console.log('[WebSocket] Socket left conversation:', conversationId);
        } catch (error) {
          console.error('[WebSocket] Error leaving conversation:', error);
        }
      });

      // Typing indicator
      socket.on('typing', (data: { conversationId: string; isTyping: boolean }) => {
        try {
          socket.to(`conversation:${data.conversationId}`).emit('user_typing', {
            conversationId: data.conversationId,
            isTyping: data.isTyping,
            userId: socket.data.userId
          });
        } catch (error) {
          console.error('[WebSocket] Error handling typing:', error);
        }
      });

      // Message read receipt
      socket.on('message_read', (data: { messageId: string; conversationId: string }) => {
        try {
          socket.to(`conversation:${data.conversationId}`).emit('message_read', {
            messageId: data.messageId,
            conversationId: data.conversationId,
            readBy: socket.data.userId
          });
        } catch (error) {
          console.error('[WebSocket] Error handling message read:', error);
        }
      });

      // Disconnect handler
      socket.on('disconnect', () => {
        console.log('[WebSocket] Client disconnected:', socket.id);
        
        // Remove from connected clients
        const userId = socket.data.userId;
        if (userId) {
          const userSockets = this.connectedClients.get(userId);
          if (userSockets) {
            userSockets.delete(socket.id);
            if (userSockets.size === 0) {
              this.connectedClients.delete(userId);
            }
          }
        }
        
        // Remove from conversation rooms
        this.conversationRooms.forEach((sockets, conversationId) => {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            this.conversationRooms.delete(conversationId);
          }
        });
      });
    });

    console.log('[WebSocket] Server initialized');
  }

  /**
   * Broadcast new message to conversation
   */
  static broadcastNewMessage(conversationId: string, message: any) {
    if (!this.io) return;
    
    this.io.to(`conversation:${conversationId}`).emit('new_message', {
      conversationId,
      message
    });
  }

  /**
   * Broadcast conversation update
   */
  static broadcastConversationUpdate(conversationId: string, update: any) {
    if (!this.io) return;
    
    this.io.to(`conversation:${conversationId}`).emit('conversation_update', {
      conversationId,
      update
    });
  }

  /**
   * Broadcast campaign progress
   */
  static broadcastCampaignProgress(campaignId: string, progress: any) {
    if (!this.io) return;
    
    this.io.to(`campaign:${campaignId}`).emit('campaign_progress', {
      campaignId,
      progress
    });
  }

  /**
   * Send notification to specific user
   */
  static sendNotificationToUser(userId: string, notification: any) {
    if (!this.io) return;
    
    this.io.to(`user:${userId}`).emit('notification', notification);
  }

  /**
   * Broadcast analytics update
   */
  static broadcastAnalyticsUpdate(data: any) {
    if (!this.io) return;
    
    this.io.emit('analytics_update', data);
  }

  /**
   * Get connected users count
   */
  static getConnectedUsersCount(): number {
    return this.connectedClients.size;
  }

  /**
   * Get conversation room size
   */
  static getConversationRoomSize(conversationId: string): number {
    const room = this.conversationRooms.get(conversationId);
    return room ? room.size : 0;
  }

  /**
   * Check if user is connected
   */
  static isUserConnected(userId: string): boolean {
    return this.connectedClients.has(userId) && this.connectedClients.get(userId)!.size > 0;
  }

  /**
   * Broadcast panic alert to ALL connected clinical staff (Pathologists, Lab Techs)
   * Called when a result is flagged as HH or LL (critical)
   */
  static broadcastPanicAlert(alert: {
    resultId: string;
    orderId: string;
    orderNumber: string;
    patientName: string;
    patientUhid: string;
    testName: string;
    parameterName: string;
    value: string;
    unit: string;
    flag: 'HH' | 'LL';
    criticalLow?: number | null;
    criticalHigh?: number | null;
    timestamp: string;
  }) {
    if (!this.io) return;
    console.log('[WebSocket] PANIC ALERT broadcast:', alert.orderNumber, alert.parameterName, alert.flag);
    // Broadcast to ALL connected users (all clinical staff must see panic)
    this.io.emit('panic_alert_new', alert);
  }

  /**
   * Broadcast result entry event (lab tech entered results)
   */
  static broadcastResultEntered(data: {
    orderId: string;
    orderNumber: string;
    patientName: string;
    resultId: string;
    testName: string;
    status: string;
    hasAbnormal: boolean;
    hasPanic: boolean;
  }) {
    if (!this.io) return;
    this.io.emit('result_entered', data);
  }

  /**
   * Broadcast sample state change (7-stage state machine)
   */
  static broadcastSampleStateChange(data: {
    sampleId: string;
    sampleBarcode: string;
    orderId: string;
    patientName: string;
    previousStatus: string;
    newStatus: string;
    timestamp: string;
  }) {
    if (!this.io) return;
    this.io.emit('sample_status_changed', data);
  }

  /**
   * Broadcast report ready event (PDF generated, ready for dispatch)
   */
  static broadcastReportReady(data: {
    reportId: string;
    orderId: string;
    orderNumber: string;
    patientName: string;
    patientUhid: string;
    patientPhone?: string;
    reportUrl: string;
    pathologistName: string;
    generatedAt: string;
  }) {
    if (!this.io) return;
    this.io.emit('report_ready', data);
  }

  /**
   * Broadcast approval/sign-off event
   */
  static broadcastApprovalSignOff(data: {
    approvalId: string;
    orderId: string;
    orderNumber: string;
    patientName: string;
    doctorName: string;
    status: 'APPROVED' | 'REJECTED' | 'AMENDED';
    timestamp: string;
  }) {
    if (!this.io) return;
    this.io.emit('approval_signoff', data);
  }

  /**
   * Broadcast live dashboard KPI update
   */
  static broadcastDashboardKpiUpdate(kpi: {
    todayPatients?: number;
    pendingApprovals?: number;
    criticalAlerts?: number;
    reportsGenerated?: number;
    todayRevenue?: number;
  }) {
    if (!this.io) return;
    this.io.emit('dashboard_kpi_update', kpi);
  }

  /**
   * Broadcast to role-based room (e.g., only pathologists)
   */
  static broadcastToRole(role: string, event: string, data: any) {
    if (!this.io) return;
    this.io.to(`role:${role}`).emit(event, data);
  }

  /**
   * Get socket instance
   */
  static getIO(): SocketIOServer {
    return this.io;
  }
}

// Helper functions for common WebSocket operations
export const broadcastWhatsAppMessage = (conversationId: string, message: any) => {
  WebSocketService.broadcastNewMessage(conversationId, message);
};

export const broadcastConversationStatus = (conversationId: string, status: string) => {
  WebSocketService.broadcastConversationUpdate(conversationId, { status });
};

export const sendUserNotification = (userId: string, notification: any) => {
  WebSocketService.sendNotificationToUser(userId, notification);
};

export const broadcastCampaignUpdate = (campaignId: string, progress: any) => {
  WebSocketService.broadcastCampaignProgress(campaignId, progress);
};