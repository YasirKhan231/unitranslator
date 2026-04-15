// app/api/notes/route.js
import { NextResponse } from "next/server";
import { verifyToken } from "../../.././lib/auth";
import dbConnect from "../../.././lib/mongodb";
import Note from "../../.././models/Note";

export async function GET(req) {
  try {
    await dbConnect();
    
    // Get token from cookies
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const notes = await Note.find({ userId: decoded.id }).sort({ createdAt: -1 });
    return NextResponse.json(notes);
    
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
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
    
    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    
    const note = await Note.create({
      userId: decoded.id,
      title: title.trim(),
      content: content || "",
    });
    
    return NextResponse.json(note, { status: 201 });
    
  } catch (error) {
    console.error("Error creating note:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}