import app from "./app";
import env from "../config/env";
import prisma from "../config/database";
import { WebSocketService } from "./lib/websocket";
import { startAnalyzerTcpServer, defaultAnalyzerTcpService } from "./modules/analyzers/analyzer.tcp.service";

const PORT = Number(env.PORT) || 5000;
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log("======================================");
  console.log("🚀 LabCore ELIS Backend Started");
  console.log(`📍 Port : ${PORT}`);
  console.log(`🌍 Mode : ${env.NODE_ENV}`);
  console.log(`🔗 URL  : http://127.0.0.1:${PORT}`);
  console.log("======================================");
});

// ISS-008: Attach Socket.io to the HTTP server AFTER listen() so the underlying
// net.Server handle is available. Previously WebSocketService.initialize() was
// never called, leaving this.io=undefined and silently dropping ALL real-time
// events (panic_alert_new, result_entered, sample_received, report_ready).
WebSocketService.initialize(server);
console.log("[WebSocket] Real-time server attached — panic alerts and live worklist updates active.");

// INC-004: Physical hardware analyzer TCP listener (HL7 v2.x MLLP & ASTM E1381)
try {
  startAnalyzerTcpServer();
} catch (err: any) {
  console.warn("[Analyzer TCP] Hardware listener startup notice:", err?.message);
}


server.on("error", (err: any) => {
  if (err.code === "EADDRINUSE") {
    console.error(`❌ Port ${PORT} is already in use. Ensure no duplicate backend instance is running.`);
  } else {
    console.error("❌ Server startup error:", err);
  }
  process.exit(1);
});

// Graceful Shutdown
const shutdown = async (signal: string) => {
  console.log(`\n${signal} received. Shutting down...`);

  try {
    await defaultAnalyzerTcpService.stop();
  } catch {
    // Ignore close errors during shutdown
  }

  await prisma.$disconnect();

  server.close(() => {
    console.log("✅ Server closed successfully");
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

export default server;