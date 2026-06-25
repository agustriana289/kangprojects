"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function AnimatedHeroTitle({ title }: { title: string }) {
  const animatedWords = ["Biasa Saja", "Pakai AI", "Yang Penting Jadi", "Asal-Asalan"];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    // 3 detik pergantian, karena 20 detik terlalu lambat untuk user experience
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % animatedWords.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [animatedWords.length]);

  const hasAnimation = title.includes("Biasa Saja");

  if (!hasAnimation) {
    const words = title ? title.split(" ") : "Wujudkan Identitas Merek yang Tak Terlupakan".split(" ");
    const midPoint = Math.ceil(words.length / 2);
    const start = words.slice(0, midPoint).join(" ");
    const end = words.slice(midPoint).join(" ");

    return (
      <h1 className="mx-auto max-w-5xl text-5xl font-extrabold tracking-tighter text-slate-900 sm:text-7xl lg:text-8xl leading-[1.1]">
        {start}{" "}
        <span className="text-primary inline-block">{end}</span>
      </h1>
    );
  }

  // Jika title mengandung "Biasa Saja", asumsikan strukturnya mirip "Karna Logo Jangan Dibuat Biasa Saja"
  // Kita split berdasarkan kata "Biasa Saja" untuk mendapatkan bagian sebelum dan sesudahnya.
  // Tapi untuk desain yang sempurna seperti screenshot, kita hardcode strukturnya sedikit:
  const baseText = title.split("Biasa Saja")[0].trim(); // "Karna Logo Jangan Dibuat"
  
  // Karena screenshot user menampilkan "Karna Logo Jangan" di baris 1 dan "Dibuat [Animasi]" di baris 2.
  // Kita pecah baseText menjadi 2 baris (misal 3 kata pertama di baris 1)
  const baseWords = baseText.split(" ");
  const line1 = baseWords.length > 2 ? baseWords.slice(0, baseWords.length - 1).join(" ") : baseWords.join(" "); // "Karna Logo Jangan"
  const line2Start = baseWords.length > 2 ? baseWords[baseWords.length - 1] : ""; // "Dibuat"

  return (
    <h1 className="mx-auto max-w-5xl text-5xl font-extrabold tracking-tighter text-slate-900 sm:text-7xl lg:text-8xl leading-[1.1] flex flex-col items-center">
      <span>{line1}</span>
      <span className="text-primary mt-2 flex flex-col sm:flex-row items-center justify-center gap-x-3 sm:gap-x-4">
        <span>{line2Start}</span>
        <span className="relative inline-grid">
          {/* Placeholder tersembunyi dengan kata terpanjang untuk menjaga kestabilan lebar */}
          <span className="col-start-1 row-start-1 opacity-0 pointer-events-none select-none whitespace-nowrap" aria-hidden="true">
            Yang Penting Jadi
          </span>
          {/* Teks Animasi */}
          <span className="col-start-1 row-start-1 flex sm:justify-start justify-center">
            <AnimatePresence mode="wait">
              <motion.span
                key={index}
                initial={{ y: 20, opacity: 0, filter: "blur(4px)" }}
                animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                exit={{ y: -20, opacity: 0, filter: "blur(4px)" }}
                transition={{ duration: 0.3 }}
                className="inline-block whitespace-nowrap"
              >
                {animatedWords[index]}
              </motion.span>
            </AnimatePresence>
          </span>
        </span>
      </span>
    </h1>
  );
}
