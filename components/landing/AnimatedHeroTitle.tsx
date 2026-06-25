"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function AnimatedHeroTitle({ title }: { title: string }) {
  const animatedWords = ["Biasa Saja", "Pakai AI", "Yang Penting Jadi", "Asal-Asalan"];
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(150);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const handleType = () => {
      const i = loopNum % animatedWords.length;
      const fullText = animatedWords[i];

      if (isDeleting) {
        setText(fullText.substring(0, text.length - 1));
        setTypingSpeed(50); // Speed of deleting
      } else {
        setText(fullText.substring(0, text.length + 1));
        setTypingSpeed(100); // Speed of typing
      }

      if (!isDeleting && text === fullText) {
        // Pause at the end of typing
        timer = setTimeout(() => setIsDeleting(true), 2000);
      } else if (isDeleting && text === "") {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
        // Small pause before typing next word
        timer = setTimeout(() => {}, 500);
      } else {
        timer = setTimeout(handleType, typingSpeed);
      }
    };

    timer = setTimeout(handleType, typingSpeed);
    return () => clearTimeout(timer);
  }, [text, isDeleting, loopNum, typingSpeed, animatedWords]);

  const hasAnimation = title.includes("Biasa Saja");

  if (!hasAnimation) {
    const words = title ? title.split(" ") : "Wujudkan Identitas Merek yang Tak Terlupakan".split(" ");
    const midPoint = Math.ceil(words.length / 2);
    const start = words.slice(0, midPoint).join(" ");
    const end = words.slice(midPoint).join(" ");

    return (
      <h1 className="mx-auto max-w-5xl text-5xl font-extrabold tracking-tighter text-slate-900 sm:text-7xl leading-[1.1]">
        {start}{" "}
        <span className="text-primary inline-block">{end}</span>
      </h1>
    );
  }

  const baseText = title.split("Biasa Saja")[0].trim();
  const baseWords = baseText.split(" ");
  const line1 = baseWords.length > 2 ? baseWords.slice(0, baseWords.length - 1).join(" ") : baseWords.join(" ");
  const line2Start = baseWords.length > 2 ? baseWords[baseWords.length - 1] : "";

  return (
    <h1 className="mx-auto max-w-5xl text-5xl font-extrabold tracking-tighter text-slate-900 sm:text-7xl leading-[1.1] flex flex-col items-center">
      <span>{line1}</span>
      <span className="text-primary mt-2 flex flex-row items-center justify-center flex-wrap gap-x-3 sm:gap-x-4">
        <span>{line2Start}</span>
        <span className="relative inline-flex items-center">
          <span>{text}</span>
          <motion.span
            animate={{ opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
            className="inline-block w-[3px] h-[1em] bg-primary ml-1 translate-y-[0.1em]"
          />
        </span>
      </span>
    </h1>
  );
}
