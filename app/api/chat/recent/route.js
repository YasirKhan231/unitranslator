import { NextResponse } from "next/server";
import { verifyToken } from "../../../../lib/auth";
import dbConnect from "../../../../lib/mongodb";
import Chat from "../../../../models/Chat";

export async function GET(req) {
  await dbConnect();

  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const myId = decoded.id;

  // Find all chats where user is a participant, sorted by latest activity
  const chats = await Chat.find({ participants: myId })
    .populate("participants", "name email")
    .sort({ updatedAt: -1 })
    .limit(20);

  const recentChats = chats.map((chat) => {
    // The other user (not me)
    const otherUser = chat.participants.find(
      (p) => p._id.toString() !== myId
    );

    // Count unread messages (not in readBy)
    const unreadCount = chat.messages.filter(
      (m) =>
        m.sender?.toString() !== myId &&
        !m.readBy?.some((r) => r.toString() === myId)
    ).length;

    return {
      chatId: chat._id,
      user: otherUser,
      lastMessage: chat.lastMessage || null,
      unreadCount,
    };
  });

  return NextResponse.json({ recentChats });
}