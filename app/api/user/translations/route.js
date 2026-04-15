// app/api/user/stats/route.js
import { NextResponse } from "next/server";
import { verifyToken } from "../../../../lib/auth";
import dbConnect from "../../../../lib/mongodb";
import Translation from "../../../../models/Translation";
import Note from "../../../../models/Note";
import Translation from "../../../../models/Translation";

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
  
  try {
    const translations = await Translation.find({ userId: decoded.id })
      .sort({ createdAt: -1 }) // Most recent first
      .limit(50); // Limit to last 50 translations
    
    return NextResponse.json(translations);
  } catch (error) {
    console.error("Error fetching translations:", error);
    return NextResponse.json({ error: "Failed to fetch translations" }, { status: 500 });
  }
}