import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { createServer } from "http";
import { Server } from "socket.io";

import { config } from "./config/index.js";
import { setupSocketHandlers } from "./lib/socket.js";
import { apiLimiter } from "./middleware/rateLimiter.js";
import { errorHandler } from "./utils/errors.js";

import healthRoutes from "./routes/health.js";
import roomRoutes from "./routes/rooms.js";
import messageRoutes from "./routes/messages.js";
import fileRoutes from "./routes/files.js";
import pollRoutes from "./routes/polls.js";
import moderationRoutes from "./routes/moderation.js";

const app = express();
const httpServer = createServer(app);

app.set("trust proxy", 1);

const io = new Server(httpServer, {
  cors: {
    origin: config.clientUrl,
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ["websocket", "polling"],
});

app.use(helmet());
app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/api", apiLimiter);

app.use(healthRoutes);
app.use(roomRoutes);
app.use(messageRoutes);
app.use(fileRoutes);
app.use(pollRoutes);
app.use(moderationRoutes);

app.use(errorHandler);

setupSocketHandlers(io);

httpServer.listen(config.port, () => {
  console.log(
    `🚀 RoomX server running on port ${config.port} [${config.nodeEnv}]`
  );
});

function gracefulShutdown(signal: string) {
  console.log(`\n${signal} received. Shutting down gracefully...`);

  io.close(() => {
    console.log("Socket.IO server closed");
  });

  httpServer.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });

  setTimeout(() => {
    console.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

export { app, io };
