import { ArrowRight, MessageCircle } from "lucide-react";
import FadeIn from "./FadeIn";
import { createClient } from "@/utils/supabase/server";

export default async function CTA({ settings }: { settings?: any }) {
  const supabase = await createClient();
  const { data: settingsData } = await supabase.from("settings").select("phone_number").eq("id", 1).single();
  const waNumber = (settingsData?.phone_number || settings?.phone_number || "").replace(/\D/g, "");
  const waText = encodeURIComponent(settings?.cta_button1_text || "Halo, saya ingin memulai proyek bersama Anda.");
  const waHref = waNumber ? `https://wa.me/${waNumber}?text=${waText}` : "#";

  return (
    <section className="bg-slate-50 py-16 sm:py-24" id="cta">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn delay={100}>
          <div className="relative isolate overflow-hidden bg-slate-950 px-6 py-20 text-center shadow-2xl rounded-3xl sm:px-16">

            <div className="absolute inset-0 -z-10">
              <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/15 blur-[100px]" />
              <div className="absolute bottom-0 right-0 w-[300px] h-[300px] rounded-full bg-secondary/10 blur-[80px]" />
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px]" />
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-white/60 mb-8">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span>Siap membantu Anda</span>
            </div>

            <h2 className="mx-auto max-w-2xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl mb-6">
              {settings?.cta_title || "Siap wujudkan proyek impian Anda?"}
            </h2>
            <p className="mx-auto max-w-xl text-lg leading-8 text-white/50 mb-10">
              {settings?.cta_description || "Konsultasi gratis, tanpa komitmen. Tim kami siap merespons dalam hitungan menit dan membantu Anda menemukan solusi terbaik."}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-14 w-full sm:w-auto items-center justify-center gap-2.5 rounded-full bg-primary px-8 text-base font-bold text-white transition-all hover:bg-secondary hover:shadow-2xl hover:shadow-primary/40 hover:-translate-y-0.5"
              >
                <MessageCircle size={18} />
                {settings?.cta_button1_text || "Mulai Konsultasi via WhatsApp"}
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </a>
              <a
                href="#semua-layanan"
                className="flex h-14 w-full sm:w-auto items-center justify-center rounded-full border border-white/15 bg-white/5 px-8 text-base font-semibold text-white/70 transition-all hover:bg-white/10 hover:border-white/25 hover:text-white"
              >
                {settings?.cta_button2_text || "Lihat Semua Layanan"}
              </a>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}