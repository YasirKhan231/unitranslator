// app/api/notes/[id]/route.js
import { NextResponse } from "next/server";
import { verifyToken } from "../../.././lib/auth";
import dbConnect from "../../.././lib/mongodb";
import Note from "../../.././models/Note";

export async function PUT(req, { params }) {
  await dbConnect();
  
  const token = req.cookies.get('token')?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const decoded = verifyToken(token);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const { title, content } = await req.json();
  await Note.findOneAndUpdate(
    { _id: params.id, userId: decoded.id },
    { title, content }
  );
  
  return NextResponse.json({ success: true });
}

export async function DELETE(req, { params }) {
  await dbConnect();
  
  const token = req.cookies.get('token')?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const decoded = verifyToken(token);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  await Note.findOneAndDelete({ _id: params.id, userId: decoded.id });
  return NextResponse.json({ success: true });
}