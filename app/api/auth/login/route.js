import dbConnect from "../../../../lib/mongodb";

import User from "../../../../models/User";
import bcrypt from "bcryptjs";
import { createToken } from "../../../../lib/auth";
import { NextResponse } from "next/server";

export async function POST(req) {
  await dbConnect();
  const { email, password } = await req.json();

  const user = await User.findOne({ email });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 400 });
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return NextResponse.json({ error: "Wrong password" }, { status: 400 });
  }

  const token = createToken(user);

  const res = NextResponse.json({ success: true });
  res.cookies.set("token", token, { 
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7 // 7 days
  });

  return res;
}