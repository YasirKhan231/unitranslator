// app/api/user/change-password/route.js
import { NextResponse } from "next/server";
import { verifyToken } from "../../../../lib/auth";
import dbConnect from "../../../../lib/mongodb";
import User from "../../../../models/User";
import bcrypt from "bcryptjs";

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
  
  const { currentPassword, newPassword } = await req.json();
  const user = await User.findById(decoded.id);
  
  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) {
    return NextResponse.json({ message: "Current password is incorrect" }, { status: 400 });
  }
  
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await User.findByIdAndUpdate(decoded.id, { password: hashedPassword });
  
  return NextResponse.json({ success: true });
}