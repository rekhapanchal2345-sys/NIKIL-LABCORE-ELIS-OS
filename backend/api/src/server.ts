import app from "./app";
import env from "../config/env";
import prisma from "../config/database";
import { WebSocketService } from "./lib/websocket";

const PORT = Number(env.PORT) || 5000;
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log("======================================");
  console.log("🚀 LabCore ELIS Backend Started");
  console.log(`📍 Port : ${PORT}`);
  console.log(`🌍 Mode : ${env.NODE_ENV}`);
  console.log(`🔗 URL  : http://127.0.0.1:${PORT}`);
  console.log("======================================");
});

WebSocketService.initialize(server);

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

  await prisma.$disconnect();

  server.close(() => {
    console.log("✅ Server closed successfully");
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

export default server;