// app/api/user/profile/route.js
import { NextResponse } from "next/server";
import { verifyToken } from "../../../../lib/auth";
import dbConnect from "../../../../lib/mongodb";
import User from "../../../../models/User";
import bcrypt from "bcryptjs";

export async function GET(req) {
  await dbConnect();
  
  const token = req.cookies.get('token')?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const decoded = verifyToken(token);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const user = await User.findById(decoded.id).select("-password");
  return NextResponse.json(user);
}

export async function PUT(req) {
  await dbConnect();
  
  const token = req.cookies.get('token')?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const decoded = verifyToken(token);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const { name, email } = await req.json();
  
  const existingUser = await User.findOne({ email, _id: { $ne: decoded.id } });
  if (existingUser) {
    return NextResponse.json({ message: "Email already in use" }, { status: 400 });
  }
  
  await User.findByIdAndUpdate(decoded.id, { name, email });
  return NextResponse.json({ success: true });
}