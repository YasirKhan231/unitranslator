"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getSocket } from "../../../lib/socket";

export default function ChatPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [recentChats, setRecentChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState("");
  const [showFindDialog, setShowFindDialog] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const socketRef = useRef(null);
  const activeChatRef = useRef(null);

  useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);

  // Fetch current user
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => { if (d.user) setCurrentUser(d.user); })
      .catch(() => {});
  }, []);

  const fetchRecentChats = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/recent");
      const data = await res.json();
      if (data.recentChats) setRecentChats(data.recentChats);
    } catch {}
  }, []);

  // Init socket
  useEffect(() => {
    if (!currentUser) return;
    const socket = getSocket();
    socketRef.current = socket;

    socket.emit("user:online", currentUser._id);

    socket.on("users:online", (users) => setOnlineUsers(users));

    // ✅ Message received from other user
    socket.on("message:receive", async (message) => {
      const chat = activeChatRef.current;
      if (chat && message.chatId === chat.chatId) {
        setMessages((prev) => {
          const exists = prev.some((m) => m._id === message._id);
          return exists ? prev : [...prev, message];
        });
        // Auto mark as read since user is viewing this chat
        await fetch(`/api/chat/read/${chat.chatId}`, { method: "POST" });
        fetchRecentChats();
      } else {
        // Not viewing this chat — just refresh sidebar for unread badge
        fetchRecentChats();
      }
    });

    // ✅ Recipient gets notified of new chat appearing in their sidebar
    socket.on("chat:newMessage", () => {
      fetchRecentChats();
    });

    socket.on("typing:start", ({ userName }) => {
      setTypingUser(userName);
      setIsTyping(true);
    });
    socket.on("typing:stop", () => {
      setIsTyping(false);
      setTypingUser("");
    });

    return () => {
      socket.off("users:online");
      socket.off("message:receive");
      socket.off("chat:newMessage");
      socket.off("typing:start");
      socket.off("typing:stop");
    };
  }, [currentUser, fetchRecentChats]);

  useEffect(() => {
    if (currentUser) fetchRecentChats();
  }, [currentUser, fetchRecentChats]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ Open chat + mark messages as read
  const openChat = async (otherUser, chatId = null) => {
    setMsgLoading(true);
    try {
      let resolvedChatId = chatId;

      if (!resolvedChatId) {
        const res = await fetch("/api/chat/find-or-create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetUserId: otherUser._id }),
        });
        const data = await res.json();
        resolvedChatId = data.chat._id;
      }

      if (activeChatRef.current) {
        socketRef.current?.emit("chat:leave", activeChatRef.current.chatId);
      }

      setActiveChat({ chatId: resolvedChatId, otherUser });
      socketRef.current?.emit("chat:join", resolvedChatId);

      const msgRes = await fetch(`/api/chat/messages/${resolvedChatId}`);
      const msgData = await msgRes.json();
      setMessages(msgData.messages || []);

      // ✅ Mark all messages as read when opening chat
      await fetch(`/api/chat/read/${resolvedChatId}`, { method: "POST" });

      fetchRecentChats(); // clears unread badge
    } catch (err) {
      console.error(err);
    } finally {
      setMsgLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeChat) return;

    const content = newMessage.trim();
    setNewMessage("");

    socketRef.current?.emit("typing:stop", { chatId: activeChat.chatId });

    try {
      const res = await fetch(`/api/chat/messages/${activeChat.chatId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
        // ✅ Pass recipientId so server notifies their sidebar
        socketRef.current?.emit("message:send", {
          chatId: activeChat.chatId,
          recipientId: activeChat.otherUser._id,
          message: { ...data.message, chatId: activeChat.chatId },
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (!activeChat || !currentUser) return;

    socketRef.current?.emit("typing:start", {
      chatId: activeChat.chatId,
      userName: currentUser.name,
    });

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit("typing:stop", { chatId: activeChat.chatId });
    }, 1500);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const searchUser = async () => {
    if (!searchEmail.trim()) return;
    setSearchLoading(true);
    setSearchError("");
    setSearchResult(null);
    try {
      const res = await fetch(`/api/chat/search-user?email=${encodeURIComponent(searchEmail)}`);
      const data = await res.json();
      if (res.ok) setSearchResult(data.user);
      else setSearchError(data.error || "User not found");
    } catch {
      setSearchError("Something went wrong");
    } finally {
      setSearchLoading(false);
    }
  };

  const startChatWithFound = () => {
    if (!searchResult) return;
    setShowFindDialog(false);
    setSearchEmail("");
    setSearchResult(null);
    openChat(searchResult);
  };

  const formatTime = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatLastSeen = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    if (diff < 86400000) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString();
  };

  const isOnline = (userId) => onlineUsers.includes(userId?.toString());

  return (
    <div className="flex h-[calc(100vh-64px)] bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* ── Sidebar ── */}
      <div className="w-80 border-r border-gray-200 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
          <button
            onClick={() => { setShowFindDialog(true); setSearchResult(null); setSearchError(""); setSearchEmail(""); }}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            title="Find user"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {recentChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 px-6 text-center">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 opacity-50">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              <p className="text-sm">No conversations yet</p>
              <button onClick={() => setShowFindDialog(true)} className="mt-3 text-sm text-gray-900 font-medium underline">
                Find someone to chat with
              </button>
            </div>
          ) : (
            recentChats.map((rc) => (
              <button
                key={rc.chatId}
                onClick={() => openChat(rc.user, rc.chatId)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left border-b border-gray-100 ${
                  activeChat?.chatId === rc.chatId?.toString() ? "bg-gray-100" : ""
                }`}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-11 h-11 rounded-full bg-gray-900 text-white flex items-center justify-center font-semibold text-sm">
                    {rc.user?.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  {isOnline(rc.user?._id) && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900 text-sm truncate">{rc.user?.name}</span>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                      {formatLastSeen(rc.lastMessage?.createdAt)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-0.5">
                    <p className="text-xs text-gray-500 truncate">
                      {rc.lastMessage?.content || "No messages yet"}
                    </p>
                    {/* ✅ Unread badge — clears after opening chat */}
                    {rc.unreadCount > 0 && (
                      <span className="ml-2 flex-shrink-0 bg-gray-900 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {rc.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Chat Area ── */}
      <div className="flex-1 flex flex-col">
        {!activeChat ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mb-4 opacity-30">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            <p className="text-lg font-medium">Select a conversation</p>
            <p className="text-sm mt-1">or find someone new to chat with</p>
            <button
              onClick={() => setShowFindDialog(true)}
              className="mt-4 px-5 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition"
            >
              Find User
            </button>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="px-5 py-3 border-b border-gray-200 flex items-center gap-3 bg-white">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-semibold text-sm">
                  {activeChat.otherUser?.name?.[0]?.toUpperCase()}
                </div>
                {isOnline(activeChat.otherUser?._id) && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{activeChat.otherUser?.name}</p>
                <p className="text-xs text-gray-400">
                  {isOnline(activeChat.otherUser?._id) ? (
                    <span className="text-green-500">Online</span>
                  ) : (
                    activeChat.otherUser?.email
                  )}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-2 bg-gray-50">
              {msgLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin text-gray-400">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                  No messages yet. Say hello! 👋
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isMine = msg.sender?._id === currentUser?._id || msg.sender === currentUser?._id;
                  return (
                    <div key={msg._id || i} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${
                          isMine
                            ? "bg-gray-900 text-white rounded-br-sm"
                            : "bg-white text-gray-900 border border-gray-200 rounded-bl-sm"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        <p className="text-xs mt-1 text-gray-400 text-right">
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 px-4 py-2 rounded-2xl rounded-bl-sm text-sm text-gray-500 flex items-center gap-1">
                    <span>{typingUser} is typing</span>
                    <span className="flex gap-0.5 ml-1">
                      {[0, 1, 2].map((i) => (
                        <span key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-5 py-3 border-t border-gray-200 bg-white flex items-end gap-3">
              <textarea
                value={newMessage}
                onChange={handleTyping}
                onKeyDown={handleKeyDown}
                placeholder="Type a message... (Enter to send)"
                rows={1}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900 placeholder-gray-400 resize-none text-sm"
                style={{ maxHeight: "120px" }}
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="p-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── Find User Dialog ── */}
      {showFindDialog && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-semibold text-gray-900">Find User</h3>
              <button
                onClick={() => { setShowFindDialog(false); setSearchResult(null); setSearchError(""); }}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              <input
                type="email"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchUser()}
                placeholder="Enter email address..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900 text-sm"
              />
              <button
                onClick={searchUser}
                disabled={searchLoading || !searchEmail.trim()}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition disabled:opacity-50"
              >
                {searchLoading ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                ) : "Search"}
              </button>
            </div>

            {searchError && <p className="text-sm text-red-600 mb-4">{searchError}</p>}

            {searchResult && (
              <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl">
                <div className="w-11 h-11 rounded-full bg-gray-900 text-white flex items-center justify-center font-semibold">
                  {searchResult.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{searchResult.name}</p>
                  <p className="text-xs text-gray-500 truncate">{searchResult.email}</p>
                </div>
                <button
                  onClick={startChatWithFound}
                  className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-800 transition"
                >
                  Chat
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}