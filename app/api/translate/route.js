import { NextResponse } from "next/server";
import { verifyToken } from "../../.././lib/auth";
import dbConnect from "../../.././lib/mongodb";
import Translation from "../../.././models/Translation";
import Note from "../../.././models/Note";
import { translate } from "@vitalets/google-translate-api";

export async function POST(req) {
  await dbConnect();

  const token = req.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { text, fromLang, toLang, saveAsNote } = await req.json();

  if (!text || !text.trim()) {
    return NextResponse.json({ error: "Text is required" }, { status: 400 });
  }

  try {
    const { text: translatedText } = await translate(text, {
      from: fromLang,
      to: toLang,
    });

    // Save translation history
    await Translation.create({
      userId: decoded.id,
      inputText: text,
      fromLang,
      toLang,
      outputText: translatedText,
    });

    if (saveAsNote) {
      await Note.create({
        userId: decoded.id,
        title: `Translation: ${text.substring(0, 50)}...`,
        content: translatedText,
      });
    }

    return NextResponse.json({
      output: translatedText,
      success: true,
    });

  } catch (error) {
    console.error("Translation error:", error);

    // Handle Google rate limiting specifically
    if (error.name === "TooManyRequestsError") {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment and try again." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Translation failed. Please try again." },
      { status: 500 }
    );
  }
}