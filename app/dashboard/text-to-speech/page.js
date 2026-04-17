"use client";

import { useState, useRef } from "react";

const VOICES = [
  // Female
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella", gender: "Female", style: "Soft & Gentle" },
  // Male
  { id: "ErXwobaYiN019PkySvjV", name: "Antoni", gender: "Male", style: "Well-rounded" },
  { id: "pNInz6obpgDQGcFmaJgB", name: "Adam", gender: "Male", style: "Narration & News" },
];

export default function TextToSpeechPage() {
  const [text, setText] = useState("");
  const [selectedVoice, setSelectedVoice] = useState(VOICES[0].id);
  const [filterGender, setFilterGender] = useState("All");
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState("");
  const audioRef = useRef(null);

  const filteredVoices = VOICES.filter(
    (v) => filterGender === "All" || v.gender === filterGender
  );

  const handleConvert = async () => {
    if (!text.trim()) {
      setError("Please enter some text to convert.");
      return;
    }
    if (text.length > 5000) {
      setError("Text must be under 5000 characters.");
      return;
    }

    setLoading(true);
    setError("");
    setAudioUrl(null);

    try {
      const res = await fetch("/api/text-to-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          voiceId: selectedVoice,
          modelId: "eleven_multilingual_v2",
          stability: 0.5,
          similarityBoost: 0.75,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Conversion failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!audioUrl) return;
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = "speech.mp3";
    a.click();
  };

  const handleClear = () => {
    setText("");
    setAudioUrl(null);
    setError("");
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Text to Speech</h1>
      <p className="text-gray-500 mb-8">
        Convert any text into natural-sounding audio instantly.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Text Input */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-medium text-gray-700">Your Text</label>
              <div className="flex items-center gap-3">
                <span className={`text-xs ${text.length > 4500 ? "text-red-500" : "text-gray-400"}`}>
                  {text.length} / 5000
                </span>
                <button
                  onClick={handleClear}
                  className="text-xs text-gray-400 hover:text-gray-600 transition"
                >
                  Clear
                </button>
              </div>
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type or paste your text here..."
              rows={10}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900 placeholder-gray-400 resize-none"
            />

            {error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleConvert}
              disabled={loading || !text.trim()}
              className="mt-4 w-full py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Generating Audio...
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  Convert to Speech
                </>
              )}
            </button>
          </div>

          {/* Audio Player */}
          {audioUrl && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <label className="text-sm font-medium text-gray-700">
                  Generated Audio
                </label>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg px-3 py-1.5 hover:border-gray-500 transition"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                  </svg>
                  Download MP3
                </button>
              </div>
              <audio ref={audioRef} controls src={audioUrl} className="w-full" />
            </div>
          )}
        </div>

        {/* Right — Voice Picker */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 h-fit">
          <label className="text-sm font-medium text-gray-700 mb-3 block">
            Choose Voice
          </label>

          {/* Gender Filter */}
          <div className="flex gap-2 mb-4">
            {["All", "Female", "Male"].map((g) => (
              <button
                key={g}
                onClick={() => setFilterGender(g)}
                className={`flex-1 text-xs py-1.5 rounded-lg border transition font-medium ${
                  filterGender === g
                    ? "bg-gray-900 text-white border-gray-900"
                    : "border-gray-200 text-gray-600 hover:border-gray-400"
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          {/* Voice List */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {filteredVoices.map((voice) => (
              <button
                key={voice.id}
                onClick={() => setSelectedVoice(voice.id)}
                className={`w-full text-left p-3 rounded-lg border transition ${
                  selectedVoice === voice.id
                    ? "border-gray-900 bg-gray-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm text-gray-900">
                    {voice.name}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      voice.gender === "Female"
                        ? "bg-pink-100 text-pink-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {voice.gender}
                  </span>
                </div>
                <div className="text-xs text-gray-400 mt-1">{voice.style}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}