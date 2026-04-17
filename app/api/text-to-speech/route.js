import { NextResponse } from "next/server";
import { verifyToken } from "../../../lib/auth";

export async function POST(req) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { text, voiceId, modelId, stability, similarityBoost } = await req.json();

  if (!text || !text.trim()) {
    return NextResponse.json({ error: "Text is required" }, { status: 400 });
  }

  if (text.length > 5000) {
    return NextResponse.json({ error: "Text too long. Max 5000 characters." }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text,
          model_id: modelId,
          voice_settings: {
            stability,
            similarity_boost: similarityBoost,
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.json();
      if (response.status === 401) {
        return NextResponse.json({ error: "Invalid ElevenLabs API key." }, { status: 401 });
      }
      if (response.status === 429) {
        return NextResponse.json({ error: "ElevenLabs rate limit hit. Try again shortly." }, { status: 429 });
      }
      return NextResponse.json({ error: err?.detail?.message || "ElevenLabs API error." }, { status: 500 });
    }

    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": "inline; filename=speech.mp3",
      },
    });
  } catch (error) {
    console.error("TTS error:", error);
    return NextResponse.json({ error: "Text to speech failed. Please try again." }, { status: 500 });
  }
}