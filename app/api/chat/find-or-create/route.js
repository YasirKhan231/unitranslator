import { NextResponse } from "next/server";
import { verifyToken } from "../../../../lib/auth";
import dbConnect from "../../../../lib/mongodb";
import Chat from "../../../../models/Chat";
import User from "../../../../models/User";

export async function POST(req) {
  await dbConnect();
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { targetUserId } = await req.json();
  const myId = decoded.id;

  // Find existing chat between the two users
  let chat = await Chat.findOne({
    participants: { $all: [myId, targetUserId], $size: 2 },
  }).populate("participants", "name email");

  if (!chat) {
    chat = await Chat.create({
      participants: [myId, targetUserId],
      messages: [],
    });
    chat = await chat.populate("participants", "name email");
  }

  // Update recentChats for both users
  await User.findByIdAndUpdate(myId, {
    $pull: { recentChats: { userId: targetUserId } },
  });
  await User.findByIdAndUpdate(myId, {
    $push: {
      recentChats: {
        $each: [{ userId: targetUserId, chatId: chat._id, lastSeen: new Date() }],
        $position: 0,
        $slice: 20,
      },
    },
  });

  return NextResponse.json({ chat });
}