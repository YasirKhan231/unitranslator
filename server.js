const { createServer } = require("http");
const { Server } = require("socket.io");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  // ✅ Now io is properly defined
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // ✅ Move userSocketMap OUTSIDE the connection handler
  const userSocketMap = {};

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("user:online", (userId) => {
      userSocketMap[userId] = socket.id;
      socket.userId = userId;
      socket.join(`user:${userId}`);
      const onlineUsers = Object.keys(userSocketMap);
      io.emit("users:online", onlineUsers);
    });

    socket.on("chat:join", (chatId) => {
      socket.join(`chat:${chatId}`);
    });

    socket.on("chat:leave", (chatId) => {
      socket.leave(`chat:${chatId}`);
    });

    socket.on("message:send", ({ chatId, message, recipientId }) => {
      socket.to(`chat:${chatId}`).emit("message:receive", message);
      socket.to(`user:${recipientId}`).emit("chat:newMessage", {
        chatId,
        message,
      });
    });

    socket.on("typing:start", ({ chatId, userName }) => {
      socket.to(`chat:${chatId}`).emit("typing:start", { userName });
    });

    socket.on("typing:stop", ({ chatId }) => {
      socket.to(`chat:${chatId}`).emit("typing:stop");
    });

    socket.on("disconnect", () => {
      delete userSocketMap[socket.userId];
      const onlineUsers = Object.keys(userSocketMap);
      io.emit("users:online", onlineUsers);
    });
  });

  httpServer.listen(3000, () => {
    console.log("> Ready on http://localhost:3000");
  });
});