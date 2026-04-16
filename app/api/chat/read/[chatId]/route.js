import { NextResponse } from "next/server";
import { verifyToken } from "../../../../../lib/auth";
import dbConnect from "../../../../../lib/mongodb";
import Chat from "../../../../../models/Chat";

export async function POST(req, { params }) {
  await dbConnect();

  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { chatId } = await params;
  const myId = decoded.id;

  // Add myId to readBy for all unread messages in this chat
  await Chat.updateOne(
    { _id: chatId },
    {
      $addToSet: {
        "messages.$[elem].readBy": myId,
      },
    },
    {
      arrayFilters: [
        {
          "elem.sender": { $ne: myId },
          "elem.readBy": { $nin: [myId] },
        },
      ],
    }
  );

  return NextResponse.json({ success: true });
}