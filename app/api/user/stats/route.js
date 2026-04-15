// app/api/user/stats/route.js
import { NextResponse } from "next/server";
import { verifyToken } from "../../../../lib/auth";
import dbConnect from "../../../../lib/mongodb";
import Translation from "../../../../models/Translation";
import Note from "../../../../models/Note";

export async function GET(req) {
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
  
  const userId = decoded.id;
  
  const translations = await Translation.countDocuments({ userId });
  const notes = await Note.countDocuments({ userId });
  
  return NextResponse.json({ translations, notes });
}