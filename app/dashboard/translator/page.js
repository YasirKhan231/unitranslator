"use client";

import { useState } from "react";

export default function TranslatorPage() {
  const [text, setText] = useState("");
  const [output, setOutput] = useState("");
  const [fromLang, setFromLang] = useState("en");
  const [toLang, setToLang] = useState("hi");
  const [loading, setLoading] = useState(false);
  const [saveAsNote, setSaveAsNote] = useState(false);
  const [error, setError] = useState("");

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

  const swapLanguages = () => {
    setFromLang(toLang);
    setToLang(fromLang);
    setText(output);
    setOutput(text);
  };

  const clearText = () => {
    setText("");
    setOutput("");
    setError("");
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
    </div>
  );
}