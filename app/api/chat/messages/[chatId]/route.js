import { NextResponse } from "next/server";
import { verifyToken } from "../../../../../lib/auth";
import dbConnect from "../../../../../lib/mongodb";
import Chat from "../../../../../models/Chat";

export async function GET(req, { params }) {
  await dbConnect();
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { chatId } = await params; // ✅ await params

  const chat = await Chat.findById(chatId).populate("messages.sender", "name email");
  if (!chat) return NextResponse.json({ error: "Chat not found" }, { status: 404 });

  const isParticipant = chat.participants.some((p) => p.toString() === decoded.id);
  if (!isParticipant) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json({ messages: chat.messages });
}

export async function POST(req, { params }) {
  await dbConnect();
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { chatId } = await params; // ✅ await params
  const { content } = await req.json();

  const chat = await Chat.findById(chatId);
  if (!chat) return NextResponse.json({ error: "Chat not found" }, { status: 404 });

  const isParticipant = chat.participants.some((p) => p.toString() === decoded.id);
  if (!isParticipant) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const newMessage = {
    sender: decoded.id,
    content,
    readBy: [decoded.id],
    createdAt: new Date(),
  };

  chat.messages.push(newMessage);
  chat.lastMessage = { content, sender: decoded.id, createdAt: new Date() };
  chat.updatedAt = new Date();
  await chat.save();

  const savedMessage = chat.messages[chat.messages.length - 1];
  await chat.populate("messages.sender", "name email");
  const populatedMessage = chat.messages.find(
    (m) => m._id.toString() === savedMessage._id.toString()
  );

  return NextResponse.json({ message: populatedMessage });
}