import { NextResponse } from "next/server";
import { verifyToken } from "../../../../lib/auth";
import dbConnect from "../../../../lib/mongodb";
import User from "../../../../models/User";

export async function GET(req) {
  await dbConnect();
  
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await User.findById(decoded.id).select("-password");
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({ user });
}