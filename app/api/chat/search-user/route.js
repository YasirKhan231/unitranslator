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

  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const user = await User.findOne({
    email: { $regex: email, $options: "i" },
    _id: { $ne: decoded.id },
  }).select("name email _id");

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({ user });
}