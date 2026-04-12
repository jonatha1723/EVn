import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    path: "/socket.io",
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    transports: ["polling"],
    allowEIO3: true,
    pingTimeout: 120000,
    pingInterval: 45000,
    cookie: false
  });

  const PORT = 3000;

  // Socket.io logic
  io.on("connection", (socket) => {
    console.log(`[Socket] User connected: ${socket.id}, transport: ${socket.conn.transport.name}`);

    socket.on("error", (err) => {
      console.error(`[Socket] Error on socket ${socket.id}:`, err);
    });

    socket.on("join_room", (userId: string) => {
      if (!userId) return;
      socket.join(userId);
      console.log(`[Socket] User ${userId} joined room ${userId}`);
    });

    socket.on("typing_status", (data: { senderId: string; receiverId: string; isTyping: boolean }) => {
      if (!data.receiverId) return;
      console.log(`[Socket] Typing status from ${data.senderId} to ${data.receiverId}: ${data.isTyping}`);
      // Broadcast typing status to the receiver's room
      io.to(data.receiverId).emit("typing_status", {
        senderId: data.senderId,
        isTyping: data.isTyping
      });
    });

    socket.on("ping", () => {
      console.log(`[Socket] Received ping from ${socket.id}`);
      socket.emit("pong");
    });

    socket.on("disconnect", (reason) => {
      console.log(`[Socket] User disconnected: ${socket.id}, reason: ${reason}`);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
