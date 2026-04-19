// app/dashboard/page.js
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Dashboard() {
  const [stats, setStats] = useState({
    translations: 0,
    notes: 0
  });
  const [recentTranslations, setRecentTranslations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchRecentTranslations();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/user/stats');
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchRecentTranslations = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/user/translations');
      const data = await res.json();
      if (Array.isArray(data)) {
        setRecentTranslations(data);
      }
    } catch (error) {
      console.error("Error fetching translations:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  // Helper function to truncate text
  const truncateText = (text, maxLength = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  // Language names mapping
  const languageNames = {
    en: "English",
    es: "Spanish",
    fr: "French",
    de: "German",
    it: "Italian",
    pt: "Portuguese",
    ru: "Russian",
    zh: "Chinese",
    ja: "Japanese",
    ko: "Korean",
    ar: "Arabic",
    hi: "Hindi",
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Welcome Back!</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Link href="/dashboard/translator" className="block">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Translations</h2>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2">
                <path d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.translations}</p>
            <p className="text-gray-600 mt-2">Total translations made</p>
          </div>
        </Link>
        
        <Link href="/dashboard/notes" className="block">
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Notes</h2>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.notes}</p>
            <p className="text-gray-600 mt-2">Total notes created</p>
          </div>
        </Link>
      </div>
      
      {/* Recent Translations Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Translations</h2>
          <Link 
            href="/dashboard/translator" 
            className="text-sm text-gray-600 hover:text-gray-900 transition"
          >
            New Translation →
          </Link>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin text-gray-500">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </div>
        ) : recentTranslations.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No translations yet.</p>
            <Link 
              href="/dashboard/translator" 
              className="inline-block mt-2 text-sm text-gray-900 font-semibold hover:underline"
            >
              Start translating →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentTranslations.map((translation) => (
              <div 
                key={translation._id} 
                className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition group"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {languageNames[translation.fromLang] || translation.fromLang} → {languageNames[translation.toLang] || translation.toLang}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDate(translation.createdAt)}
                      </span>
                    </div>
                    <p className="text-gray-900 text-sm font-medium mb-1">
                      {truncateText(translation.inputText, 60)}
                    </p>
                    <p className="text-gray-600 text-sm">
                      {truncateText(translation.outputText, 80)}
                    </p>
                  </div>
                  <Link 
                    href="/dashboard/translator"
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition"
                    title="Translate more"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 2l4 4-4 4M3 12h15.5M7 2l4 4-4 4" />
                      <path d="M3 8l4-4-4-4" />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {recentTranslations.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-100 text-center">
            <Link 
              href="/dashboard/translator" 
              className="text-sm text-gray-500 hover:text-gray-900 transition"
            >
              View all translations →
            </Link>
          </div>
        )}
      </div>
      
      {/* Quick Tips */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Tips</h2>
        <ul className="space-y-2 text-gray-600">
          <li>✨ Translate text between 25+ languages</li>
          <li>📝 Save important translations as notes</li>
          <li>⚡ Fast and accurate translations</li>
          <li>🔄 Click on any translation to copy it</li>
        </ul>
      </div>
    </div>
  );
}