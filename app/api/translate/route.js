// app/api/translate/route.js
import { NextResponse } from "next/server";
import { verifyToken } from "../../.././lib/auth";
import dbConnect from "../../.././lib/mongodb";
import Translation from "../../.././models/Translation";
import Note from "../../.././models/Note";

// Map frontend language codes to MyMemory compatible codes
const languageMap = {
  'zh': 'zh-CN',  // Chinese to zh-CN
  'auto': 'en',   // Default auto to English
};

export async function POST(req) {
  await dbConnect();
  
  const token = req.cookies.get('token')?.value;
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
    // Convert language codes for MyMemory
    let sourceLang = fromLang === 'auto' ? '' : (languageMap[fromLang] || fromLang);
    let targetLang = languageMap[toLang] || toLang;
    
    // If source is auto, leave it empty for MyMemory to auto-detect
    const langPair = sourceLang ? `${sourceLang}|${targetLang}` : `|${targetLang}`;
    
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;
    console.log(`Calling API with langpair: ${langPair}`);
    
    const res = await fetch(url);
    const data = await res.json();
    
    let translatedText = data.responseData.translatedText;
    
    // Clean up HTML entities
    if (translatedText) {
      translatedText = translatedText.replace(/&quot;/g, '"');
      translatedText = translatedText.replace(/&#39;/g, "'");
      translatedText = translatedText.replace(/&amp;/g, "&");
      translatedText = translatedText.replace(/&lt;/g, "<");
      translatedText = translatedText.replace(/&gt;/g, ">");
    }
    
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
      success: true 
    });
    
  } catch (error) {
    console.error("Translation error:", error);
    return NextResponse.json({ 
      error: "Translation failed. Please try again." 
    }, { status: 500 });
  }
}