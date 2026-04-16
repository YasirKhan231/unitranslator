io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Map userId -> socketId
  const userSocketMap = {};

  socket.on("user:online", (userId) => {
    userSocketMap[userId] = socket.id;
    socket.userId = userId;
    socket.join(`user:${userId}`); // ✅ Each user joins their own room
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
    // Send to everyone in chat room except sender
    socket.to(`chat:${chatId}`).emit("message:receive", message);

    // ✅ Also notify recipient's personal room to refresh sidebar
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