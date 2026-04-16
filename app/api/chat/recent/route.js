import { NextResponse } from "next/server";
import { verifyToken } from "../../../../lib/auth";
import dbConnect from "../../../../lib/mongodb";
import User from "../../../../models/User";
import Chat from "../../../../models/Chat";

export async function GET(req) {
  await dbConnect();
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await User.findById(decoded.id).populate("recentChats.userId", "name email");

  const recentWithChats = await Promise.all(
    (user.recentChats || []).map(async (rc) => {
      const chat = await Chat.findById(rc.chatId);
      return {
        user: rc.userId,
        chatId: rc.chatId,
        lastSeen: rc.lastSeen,
        lastMessage: chat?.lastMessage || null,
        unreadCount: chat
          ? chat.messages.filter(
              (m) =>
                m.sender.toString() !== decoded.id &&
                !m.readBy.includes(decoded.id)
            ).length
          : 0,
      };
    })
  );

  return NextResponse.json({ recentChats: recentWithChats });
}