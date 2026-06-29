"use client";

import { useEffect, useState } from "react";

export function Typewriter({ text, speed = 14 }: { text: string; speed?: number }) {
  const [display, setDisplay] = useState("");

  useEffect(() => {
    setDisplay("");
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setDisplay(text.slice(0, index));
      if (index >= text.length) window.clearInterval(timer);
    }, speed);
    return () => window.clearInterval(timer);
  }, [speed, text]);

  return <span>{display}</span>;
}
