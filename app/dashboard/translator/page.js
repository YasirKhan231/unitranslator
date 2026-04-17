"use client";

import { useState, useRef } from "react";

const VOICES = [
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella", gender: "Female", style: "Soft & Gentle" },
  { id: "ErXwobaYiN019PkySvjV", name: "Antoni", gender: "Male", style: "Well-rounded" },
  { id: "pNInz6obpgDQGcFmaJgB", name: "Adam", gender: "Male", style: "Narration & News" },
];

export default function TranslatorPage() {
  const [text, setText] = useState("");
  const [output, setOutput] = useState("");
  const [fromLang, setFromLang] = useState("en");
  const [toLang, setToLang] = useState("hi");
  const [loading, setLoading] = useState(false);
  const [saveAsNote, setSaveAsNote] = useState(false);
  const [error, setError] = useState("");

  // TTS states
  const [selectedVoice, setSelectedVoice] = useState(VOICES[0].id);
  const [filterGender, setFilterGender] = useState("All");
  const [ttsLoading, setTtsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [ttsError, setTtsError] = useState("");
  const audioRef = useRef(null);

  const filteredVoices = VOICES.filter(
    (v) => filterGender === "All" || v.gender === filterGender
  );

  const languages = [
    { code: "en", name: "English" },
    { code: "hi", name: "Hindi" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "it", name: "Italian" },
    { code: "pt", name: "Portuguese" },
    { code: "ru", name: "Russian" },
    { code: "zh-CN", name: "Chinese (Simplified)" },
    { code: "zh-TW", name: "Chinese (Traditional)" },
    { code: "ja", name: "Japanese" },
    { code: "ko", name: "Korean" },
    { code: "ar", name: "Arabic" },
    { code: "bn", name: "Bengali" },
    { code: "pa", name: "Punjabi" },
    { code: "mr", name: "Marathi" },
    { code: "gu", name: "Gujarati" },
    { code: "ta", name: "Tamil" },
    { code: "te", name: "Telugu" },
    { code: "kn", name: "Kannada" },
    { code: "ml", name: "Malayalam" },
    { code: "ur", name: "Urdu" },
    { code: "tr", name: "Turkish" },
    { code: "nl", name: "Dutch" },
    { code: "pl", name: "Polish" },
    { code: "sv", name: "Swedish" },
    { code: "da", name: "Danish" },
    { code: "fi", name: "Finnish" },
    { code: "no", name: "Norwegian" },
    { code: "cs", name: "Czech" },
    { code: "sk", name: "Slovak" },
    { code: "ro", name: "Romanian" },
    { code: "hu", name: "Hungarian" },
    { code: "el", name: "Greek" },
    { code: "he", name: "Hebrew" },
    { code: "fa", name: "Persian" },
    { code: "id", name: "Indonesian" },
    { code: "ms", name: "Malay" },
    { code: "th", name: "Thai" },
    { code: "vi", name: "Vietnamese" },
  ];

  const handleTranslate = async () => {
    if (!text.trim()) {
      setError("Please enter text to translate");
      return;
    }

    setLoading(true);
    setError("");
    setOutput("");
    // Reset TTS when translating again
    setAudioUrl(null);
    setTtsError("");

    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, fromLang, toLang, saveAsNote }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Translation failed");
      }

      setOutput(data.output);

      if (saveAsNote) {
        alert("Translation saved as note!");
        setSaveAsNote(false);
      }
    } catch (error) {
      console.error("Translation failed:", error);
      setError(error.message || "Translation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToSpeech = async () => {
    if (!output.trim()) return;

    setTtsLoading(true);
    setTtsError("");
    setAudioUrl(null);

    try {
      const res = await fetch("/api/text-to-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: output,
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
      setTtsError(err.message || "Something went wrong. Please try again.");
    } finally {
      setTtsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!audioUrl) return;
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = "translated-speech.mp3";
    a.click();
  };

  const swapLanguages = () => {
    setFromLang(toLang);
    setToLang(fromLang);
    setText(output);
    setOutput(text);
    setAudioUrl(null);
    setTtsError("");
  };

  const clearText = () => {
    setText("");
    setOutput("");
    setError("");
    setAudioUrl(null);
    setTtsError("");
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Translator</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {/* Language Selectors */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
            <select
              value={fromLang}
              onChange={(e) => setFromLang(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={swapLanguages}
            disabled={!output}
            className="self-end mb-2 p-2 hover:bg-gray-100 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
            title="Swap languages"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 16V4m0 0L3 8m4-4l4 4" />
              <path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
            <select
              value={toLang}
              onChange={(e) => setToLang(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Side-by-Side Translation View */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Input Section */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">
                {languages.find((l) => l.code === fromLang)?.name || "Source Text"}
              </label>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">{text.length} chars</span>
                <button onClick={clearText} className="text-xs text-gray-500 hover:text-gray-700">
                  Clear
                </button>
              </div>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text to translate..."
              rows={8}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900 placeholder-gray-400 resize-none font-mono"
            />
          </div>

          {/* Output Section */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">
                {languages.find((l) => l.code === toLang)?.name || "Translation"}
              </label>
              {output && (
                <button
                  onClick={() => navigator.clipboard.writeText(output)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Copy
                </button>
              )}
            </div>
            <div className="relative">
              {loading ? (
                <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 min-h-[200px] flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <svg
                      width="30"
                      height="30"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="animate-spin text-gray-500"
                    >
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    <span className="text-gray-500">Translating...</span>
                  </div>
                </div>
              ) : output ? (
                <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 min-h-[200px]">
                  <p className="text-gray-900 whitespace-pre-wrap font-mono">{output}</p>
                </div>
              ) : (
                <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 min-h-[200px]">
                  <p className="text-gray-400 italic">Translation will appear here...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Options and Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={saveAsNote}
              onChange={(e) => setSaveAsNote(e.target.checked)}
              className="w-4 h-4 text-gray-900 rounded cursor-pointer"
            />
            <span className="text-sm text-gray-700">Save translation as note</span>
          </label>

          <button
            onClick={handleTranslate}
            disabled={loading || !text.trim()}
            className="px-8 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="animate-spin"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            )}
            {loading ? "Translating..." : "Translate"}
          </button>
        </div>
      </div>

      {/* ── Text-to-Speech Panel (shown only after translation) ── */}
      {output && !loading && (
        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-700">
              <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            <h2 className="text-lg font-semibold text-gray-900">Convert Translation to Speech</h2>
          </div>
          <p className="text-sm text-gray-500 mb-5">
            Listen to your translated text using AI voices.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Translated text preview + convert button */}
            <div className="lg:col-span-2 space-y-4">
              {/* Character count + preview */}
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Translated Text
                  </span>
                  <span className={`text-xs font-medium ${output.length > 4500 ? "text-red-500" : "text-gray-400"}`}>
                    {output.length} / 5000 chars
                  </span>
                </div>
                <p className="text-sm text-gray-800 whitespace-pre-wrap font-mono line-clamp-4">
                  {output}
                </p>
              </div>

              {/* TTS Error */}
              {ttsError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {ttsError}
                </div>
              )}

              {/* Convert button */}
              <button
                onClick={handleConvertToSpeech}
                disabled={ttsLoading || output.length > 5000}
                className="w-full py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {ttsLoading ? (
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

              {/* Audio Player */}
              {audioUrl && (
                <div className="rounded-xl border border-gray-200 p-4 bg-white">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-gray-700">Generated Audio</span>
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg px-3 py-1.5 hover:border-gray-500 transition"
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

            {/* Voice Picker */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 h-fit">
              <label className="text-sm font-medium text-gray-700 mb-3 block">Choose Voice</label>

              {/* Gender Filter */}
              <div className="flex gap-2 mb-4">
                {["All", "Female", "Male"].map((g) => (
                  <button
                    key={g}
                    onClick={() => setFilterGender(g)}
                    className={`flex-1 text-xs py-1.5 rounded-lg border transition font-medium ${
                      filterGender === g
                        ? "bg-gray-900 text-white border-gray-900"
                        : "border-gray-200 text-gray-600 hover:border-gray-400 bg-white"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>

              {/* Voice List */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {filteredVoices.map((voice) => (
                  <button
                    key={voice.id}
                    onClick={() => {
                      setSelectedVoice(voice.id);
                      setAudioUrl(null); // reset audio when voice changes
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition ${
                      selectedVoice === voice.id
                        ? "border-gray-900 bg-white"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-gray-900">{voice.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        voice.gender === "Female"
                          ? "bg-pink-100 text-pink-700"
                          : "bg-blue-100 text-blue-700"
                      }`}>
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
      )}
    </div>
  );
}