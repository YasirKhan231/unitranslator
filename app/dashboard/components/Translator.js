"use client";

import { useState } from "react";

export default function Translator() {
  const [text, setText] = useState("");
  const [output, setOutput] = useState("");

  const handleTranslate = async () => {
    const res = await fetch("/api/translate", {
      method: "POST",
      body: JSON.stringify({ text }),
    });

    const data = await res.json();
    setOutput(data.output);
  };

  return (
    <div>
      <textarea onChange={(e)=>setText(e.target.value)} />
      <button onClick={handleTranslate}>Translate</button>
      <p>{output}</p>
    </div>
  );
}