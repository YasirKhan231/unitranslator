import { NextResponse } from "next/server";
import { verifyToken } from "../../../../lib/auth";
import dbConnect from "../../../../lib/mongodb";
import Note from "../../../../models/Note";

export async function PUT(req, { params }) {
  await dbConnect();

  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { title, content, tags, color, pinned, priority } = await req.json();

  const updated = await Note.findOneAndUpdate(
    { _id: id, userId: decoded.id },
    { $set: { title, content, tags, color, pinned, priority, updatedAt: new Date() } }, // ✅ use $set
    { new: true } // ✅ back to `new: true` — returnDocument was causing the silent fail
  );

  if (!updated) return NextResponse.json({ error: "Note not found" }, { status: 404 });

  return NextResponse.json(updated);
}

export async function DELETE(req, { params }) {
  await dbConnect();

  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params; // ✅ await params

  const deleted = await Note.findOneAndDelete({ _id: id, userId: decoded.id });
  if (!deleted) return NextResponse.json({ error: "Note not found" }, { status: 404 });

  return NextResponse.json({ success: true });
}