import prisma from "../lib/prisma";

// AI Service for WhatsApp Premium Features
export class WhatsAppAIService {
  
  /**
   * Analyze sentiment of a message
   * Returns sentiment score and classification
   */
  static async analyzeSentiment(message: string): Promise<{
    sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
    score: number;
    emotions: Record<string, number>;
    keywords: string[];
  }> {
    try {
      // Simple sentiment analysis (in production, use actual AI service like OpenAI, Google Cloud NLP, etc.)
      const positiveWords = ['thank', 'thanks', 'good', 'great', 'excellent', 'happy', 'satisfied', 'appreciate', 'love', 'wonderful'];
      const negativeWords = ['bad', 'poor', 'terrible', 'unhappy', 'dissatisfied', 'angry', 'frustrated', 'disappointed', 'hate', 'awful'];
      
      const lowerMessage = message.toLowerCase();
      let positiveCount = 0;
      let negativeCount = 0;
      
      positiveWords.forEach(word => {
        if (lowerMessage.includes(word)) positiveCount++;
      });
      
      negativeWords.forEach(word => {
        if (lowerMessage.includes(word)) negativeCount++;
      });
      
      const totalWords = positiveCount + negativeCount;
      let score = 0;
      let sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' = 'NEUTRAL';
      
      if (totalWords > 0) {
        score = (positiveCount - negativeCount) / totalWords;
        if (score > 0.2) sentiment = 'POSITIVE';
        else if (score < -0.2) sentiment = 'NEGATIVE';
      }
      
      // Extract keywords (simple implementation)
      const keywords = lowerMessage
        .split(/\s+/)
        .filter(word => word.length > 3)
        .slice(0, 5);
      
      // Simulate emotion detection
      const emotions = {
        joy: sentiment === 'POSITIVE' ? Math.random() * 0.5 + 0.5 : Math.random() * 0.3,
        anger: sentiment === 'NEGATIVE' ? Math.random() * 0.5 + 0.5 : Math.random() * 0.2,
        sadness: sentiment === 'NEGATIVE' ? Math.random() * 0.4 + 0.3 : Math.random() * 0.2,
        neutral: sentiment === 'NEUTRAL' ? Math.random() * 0.5 + 0.5 : Math.random() * 0.3,
      };
      
      return {
        sentiment,
        score: Math.abs(score),
        emotions,
        keywords
      };
    } catch (error) {
      console.error('[WhatsApp AI] Error analyzing sentiment:', error);
      return {
        sentiment: 'NEUTRAL',
        score: 0,
        emotions: {},
        keywords: []
      };
    }
  }
  
  /**
   * Analyze conversation sentiment over time
   */
  static async analyzeConversationSentiment(conversationId: string): Promise<{
    overallSentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
    sentimentScore: number;
    emotions: Record<string, number>;
    keywords: string[];
    issues: string[];
  }> {
    try {
      const conversation = await prisma.whatsAppConversation.findUnique({
        where: { id: conversationId },
        include: {
          incomingMessages: {
            where: { processed: true },
            orderBy: { createdAt: 'desc' },
            take: 50
          }
        }
      });
      
      if (!conversation || conversation.incomingMessages.length === 0) {
        return {
          overallSentiment: 'NEUTRAL',
          sentimentScore: 0,
          emotions: {},
          keywords: [],
          issues: []
        };
      }
      
      const messages = conversation.incomingMessages;
      let totalScore = 0;
      const allEmotions: Record<string, number[]> = {};
      const allKeywords: string[] = [];
      const issues: string[] = [];
      
      for (const message of messages) {
        const analysis = await this.analyzeSentiment(message.messageContent);
        totalScore += analysis.score;
        
        // Aggregate emotions
        Object.entries(analysis.emotions).forEach(([emotion, value]) => {
          if (!allEmotions[emotion]) allEmotions[emotion] = [];
          allEmotions[emotion].push(value);
        });
        
        allKeywords.push(...analysis.keywords);
        
        // Detect potential issues
        if (analysis.sentiment === 'NEGATIVE' && analysis.score > 0.5) {
          issues.push(`Negative sentiment detected: ${message.messageContent.substring(0, 50)}...`);
        }
      }
      
      const averageScore = totalScore / messages.length;
      let overallSentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' = 'NEUTRAL';
      
      if (averageScore > 0.3) overallSentiment = 'POSITIVE';
      else if (averageScore < -0.3) overallSentiment = 'NEGATIVE';
      
      // Average emotions
      const averagedEmotions: Record<string, number> = {};
      Object.entries(allEmotions).forEach(([emotion, values]) => {
        averagedEmotions[emotion] = values.reduce((a, b) => a + b, 0) / values.length;
      });
      
      // Get top keywords
      const keywordCounts = allKeywords.reduce((acc, keyword) => {
        acc[keyword] = (acc[keyword] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const topKeywords = Object.entries(keywordCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([keyword]) => keyword);
      
      return {
        overallSentiment,
        sentimentScore: averageScore,
        emotions: averagedEmotions,
        keywords: topKeywords,
        issues
      };
    } catch (error) {
      console.error('[WhatsApp AI] Error analyzing conversation sentiment:', error);
      return {
        overallSentiment: 'NEUTRAL',
        sentimentScore: 0,
        emotions: {},
        keywords: [],
        issues: []
      };
    }
  }
  
  /**
   * Generate smart auto-response based on message content and context
   */
  static async generateAutoResponse(
    message: string,
    conversationContext?: any,
    aiModel: string = 'basic'
  ): Promise<{
    response: string;
    confidence: number;
    suggestedActions: string[];
  }> {
    try {
      const lowerMessage = message.toLowerCase();
      
      // Intent detection (simple rule-based approach)
      const intents = {
        appointment: ['appointment', 'schedule', 'book', 'timing', 'when', 'time'],
        results: ['result', 'report', 'test', 'outcome', 'status'],
        payment: ['payment', 'pay', 'cost', 'price', 'fee', 'invoice', 'bill'],
        location: ['location', 'address', 'where', 'direction', 'map'],
        hours: ['hours', 'open', 'close', 'timing'],
        urgent: ['urgent', 'emergency', 'immediate', 'asap', 'help'],
        complaint: ['complaint', 'issue', 'problem', 'wrong', 'error', 'mistake'],
        thanks: ['thank', 'thanks', 'appreciate'],
        greeting: ['hello', 'hi', 'hey', 'good morning', 'good afternoon']
      };
      
      let detectedIntent: string | null = null;
      let maxMatches = 0;
      
      for (const [intent, keywords] of Object.entries(intents)) {
        const matches = keywords.filter(keyword => lowerMessage.includes(keyword)).length;
        if (matches > maxMatches) {
          maxMatches = matches;
          detectedIntent = intent;
        }
      }
      
      // Generate response based on intent
      let response = '';
      let confidence = 0.5;
      let suggestedActions: string[] = [];
      
      switch (detectedIntent) {
        case 'appointment':
          response = 'I can help you schedule an appointment. Would you like me to check available slots or connect you with our scheduling team?';
          confidence = 0.8;
          suggestedActions = ['Check Availability', 'Connect to Agent', 'View Schedule'];
          break;
        case 'results':
          response = 'Your test results are being processed. You can check the status in your patient portal or I can connect you with a lab technician for more details.';
          confidence = 0.85;
          suggestedActions = ['Check Status', 'Connect to Lab', 'View Portal'];
          break;
        case 'payment':
          response = 'I can help you with payment information. Would you like to check your balance, make a payment, or view your invoice?';
          confidence = 0.8;
          suggestedActions = ['Check Balance', 'Make Payment', 'View Invoice'];
          break;
        case 'location':
          response = 'Our laboratory is located at [Address]. We are easily accessible by public transport. Would you like directions?';
          confidence = 0.9;
          suggestedActions = ['Get Directions', 'View Map', 'Call for Help'];
          break;
        case 'hours':
          response = 'We are open Monday to Saturday, 8:00 AM to 8:00 PM. Sunday we operate from 9:00 AM to 2:00 PM.';
          confidence = 0.95;
          suggestedActions = ['Schedule Appointment', 'Contact Us'];
          break;
        case 'urgent':
          response = 'I understand this is urgent. Let me connect you with our emergency support team immediately.';
          confidence = 0.9;
          suggestedActions = ['Emergency Support', 'Call Now', 'Priority Queue'];
          break;
        case 'complaint':
          response = 'I\'m sorry to hear you\'re experiencing an issue. I\'ll connect you with our customer support team right away to resolve this.';
          confidence = 0.85;
          suggestedActions = ['Connect to Support', 'Submit Ticket', 'Manager Callback'];
          break;
        case 'thanks':
          response = 'You\'re welcome! Is there anything else I can help you with today?';
          confidence = 0.9;
          suggestedActions = ['Start New Query', 'End Chat'];
          break;
        case 'greeting':
          response = 'Hello! Welcome to LabCore. How can I assist you today?';
          confidence = 0.95;
          suggestedActions = ['Book Appointment', 'Check Results', 'Make Payment'];
          break;
        default:
          response = 'Thank you for your message. How can I help you today? You can ask about appointments, results, payments, or our location.';
          confidence = 0.4;
          suggestedActions = ['Book Appointment', 'Check Results', 'Make Payment', 'Contact Support'];
      }
      
      return {
        response,
        confidence,
        suggestedActions
      };
    } catch (error) {
      console.error('[WhatsApp AI] Error generating auto-response:', error);
      return {
        response: 'I apologize, but I\'m having trouble understanding your request. Let me connect you with a human agent.',
        confidence: 0.2,
        suggestedActions: ['Connect to Agent']
      };
    }
  }
  
  /**
   * Predict optimal engagement time for a patient
   */
  static async predictOptimalEngagementTime(patientId: string): Promise<{
    recommendedTime: Date;
    confidence: number;
    reasoning: string;
  }> {
    try {
      // In production, this would use ML models trained on engagement data
      // For now, use simple heuristics
      
      const patient = await prisma.patient.findUnique({
        where: { id: patientId },
        include: {
          whatsappConversations: {
            orderBy: { lastMessageAt: 'desc' },
            take: 20
          }
        }
      });
      
      if (!patient || patient.whatsappConversations.length === 0) {
        // Default to morning hours
        const now = new Date();
        const recommendedTime = new Date(now);
        recommendedTime.setHours(10, 0, 0, 0);
        if (recommendedTime <= now) {
          recommendedTime.setDate(recommendedTime.getDate() + 1);
        }
        
        return {
          recommendedTime,
          confidence: 0.3,
          reasoning: 'No historical data available. Using default morning hours.'
        };
      }
      
      // Analyze conversation times to find patterns
      const conversations = patient.whatsappConversations;
      const hourCounts = new Array(24).fill(0);
      
      conversations.forEach(conv => {
        const hour = conv.lastMessageAt.getHours();
        hourCounts[hour]++;
      });
      
      // Find peak hour
      const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
      const peakCount = Math.max(...hourCounts);
      const confidence = peakCount / conversations.length;
      
      // Calculate recommended time
      const now = new Date();
      const recommendedTime = new Date(now);
      recommendedTime.setHours(peakHour, 0, 0, 0);
      
      // If peak hour has passed, schedule for tomorrow
      if (recommendedTime <= now) {
        recommendedTime.setDate(recommendedTime.getDate() + 1);
      }
      
      return {
        recommendedTime,
        confidence: Math.min(confidence + 0.2, 0.9),
        reasoning: `Based on ${conversations.length} past interactions, patient is most responsive around ${peakHour}:00.`
      };
    } catch (error) {
      console.error('[WhatsApp AI] Error predicting engagement time:', error);
      
      const now = new Date();
      const recommendedTime = new Date(now);
      recommendedTime.setHours(10, 0, 0, 0);
      if (recommendedTime <= now) {
        recommendedTime.setDate(recommendedTime.getDate() + 1);
      }
      
      return {
        recommendedTime,
        confidence: 0.2,
        reasoning: 'Unable to analyze patterns. Using default time.'
      };
    }
  }
  
  /**
   * Suggest personalized message content based on patient history
   */
  static async suggestPersonalizedContent(patientId: string, messageType: string): Promise<{
    suggestions: string[];
    reasoning: string;
  }> {
    try {
      const patient = await prisma.patient.findUnique({
        where: { id: patientId },
        include: {
          orders: {
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: {
              items: {
                include: {
                  test: true
                }
              }
            }
          }
        }
      });
      
      if (!patient) {
        return {
          suggestions: ['Hello! How can we help you today?'],
          reasoning: 'Patient not found. Using generic greeting.'
        };
      }
      
      const suggestions: string[] = [];
      let reasoning = '';
      
      switch (messageType) {
        case 'follow_up':
          if (patient.orders.length > 0) {
            const lastOrder = patient.orders[0];
            const testNames = lastOrder.items.map((item: any) => item.test?.testName).filter(Boolean).join(', ');
            suggestions.push(
              `Hi ${patient.firstName}, following up on your recent tests for ${testNames}. Do you have any questions?`,
              `Hello ${patient.firstName}, we hope you're doing well. Any updates on your recent test results?`
            );
            reasoning = `Based on recent order #${lastOrder.orderNumber} with tests: ${testNames}`;
          } else {
            suggestions.push(
              `Hi ${patient.firstName}, just checking in to see how you're doing. Is there anything we can help you with?`
            );
            reasoning = 'No recent orders found. Using general follow-up.';
          }
          break;
          
        case 'reminder':
          if (patient.orders.some(order => order.orderStatus === 'REGISTERED' || order.orderStatus === 'SAMPLE_COLLECTED')) {
            suggestions.push(
              `Reminder: Your sample collection is scheduled. Please fast for 8-12 hours if required.`,
              `Hi ${patient.firstName}, friendly reminder about your upcoming test. Please arrive on time.`
            );
            reasoning = 'Patient has pending sample collection.';
          } else {
            suggestions.push(
              `Hi ${patient.firstName}, this is a friendly reminder from LabCore.`
            );
            reasoning = 'No pending collections found.';
          }
          break;
          
        case 'result_ready':
          suggestions.push(
            `Great news, ${patient.firstName}! Your test results are ready. You can view them in your patient portal.`,
            `Hello ${patient.firstName}, your results are now available. Log in to your portal to view them.`
          );
          reasoning = 'Standard result notification.';
          break;
          
        default:
          suggestions.push(
            `Hello ${patient.firstName}, how can we assist you today?`,
            `Hi ${patient.firstName}, is there anything specific you need help with?`
          );
          reasoning = 'Using personalized greeting.';
      }
      
      return { suggestions, reasoning };
    } catch (error) {
      console.error('[WhatsApp AI] Error suggesting personalized content:', error);
      return {
        suggestions: ['Hello! How can we help you today?'],
        reasoning: 'Error occurred. Using generic message.'
      };
    }
  }
  
  /**
   * Detect potential issues in conversation
   */
  static async detectIssues(conversationId: string): Promise<{
    issues: Array<{
      type: string;
      severity: 'LOW' | 'MEDIUM' | 'HIGH';
      description: string;
      suggestedAction: string;
    }>;
  }> {
    try {
      const conversation = await prisma.whatsAppConversation.findUnique({
        where: { id: conversationId },
        include: {
          incomingMessages: {
            where: { processed: true },
            orderBy: { createdAt: 'desc' },
            take: 20
          }
        }
      });
      
      if (!conversation) {
        return { issues: [] };
      }
      
      const issues: Array<{
        type: string;
        severity: 'LOW' | 'MEDIUM' | 'HIGH';
        description: string;
        suggestedAction: string;
      }> = [];
      
      const messages = conversation.incomingMessages;
      
      // Check for repeated negative sentiment
      const sentimentPromises = messages.map(message => this.analyzeSentiment(message.messageContent));
      const sentiments = await Promise.all(sentimentPromises);

      const negativeCount = sentiments.filter(sentiment => sentiment.sentiment === 'NEGATIVE').length;
      
      if (negativeCount >= 3) {
        issues.push({
          type: 'REPEATED_NEGATIVITY',
          severity: 'HIGH',
          description: `Patient has expressed negative sentiment ${negativeCount} times in recent messages.`,
          suggestedAction: 'Escalate to human agent immediately'
        });
      }
      
      // Check for long response times
      if (conversation.unreadCount > 5) {
        issues.push({
          type: 'HIGH_UNREAD_COUNT',
          severity: 'MEDIUM',
          description: `Conversation has ${conversation.unreadCount} unread messages.`,
          suggestedAction: 'Prioritize this conversation for response'
        });
      }
      
      // Check for conversation age without resolution
      const lastMessage = messages[0];
      if (lastMessage) {
        const hoursSinceLastMessage = (Date.now() - lastMessage.createdAt.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastMessage > 24 && conversation.status === 'ACTIVE') {
          issues.push({
            type: 'STALLED_CONVERSATION',
            severity: 'LOW',
            description: `Conversation has been active for ${Math.floor(hoursSinceLastMessage)} hours without resolution.`,
            suggestedAction: 'Send follow-up message or close conversation'
          });
        }
      }
      
      return { issues };
    } catch (error) {
      console.error('[WhatsApp AI] Error detecting issues:', error);
      return { issues: [] };
    }
  }
}