const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  // Store online users: { userId -> socketId }
  const onlineUsers = new Map();

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // Register user as online
    socket.on("user:online", (userId) => {
      onlineUsers.set(userId, socket.id);
      socket.userId = userId;
      io.emit("users:online", Array.from(onlineUsers.keys()));
    });

    // Join a chat room
    socket.on("chat:join", (chatId) => {
      socket.join(chatId);
    });

    // Leave a chat room
    socket.on("chat:leave", (chatId) => {
      socket.leave(chatId);
    });

    // Send message
    socket.on("message:send", (data) => {
      // data: { chatId, message }
      // Broadcast to everyone in the room including sender
      io.to(data.chatId).emit("message:receive", data.message);
    });

    // Typing indicator
    socket.on("typing:start", ({ chatId, userName }) => {
      socket.to(chatId).emit("typing:start", { userName });
    });

    socket.on("typing:stop", ({ chatId }) => {
      socket.to(chatId).emit("typing:stop");
    });

    socket.on("disconnect", () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        io.emit("users:online", Array.from(onlineUsers.keys()));
      }
    });
  });

  httpServer.listen(3000, () => {
    console.log("> Ready on http://localhost:3000");
  });
});