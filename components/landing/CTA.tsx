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
    <section className="bg-white py-24 sm:py-32" id="cta">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn delay={100}>
          <div className="relative isolate overflow-hidden bg-slate-900 rounded-3xl px-6 py-24 text-center shadow-2xl sm:px-16">
            
            {/* Subtle background glow */}
            <div className="absolute inset-0 -z-10">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/20 blur-[120px]" />
            </div>

            <h2 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl mb-8">
              {settings?.cta_title || "Siap membangun identitas yang kuat?"}
            </h2>
            <p className="mx-auto max-w-2xl text-lg sm:text-xl leading-relaxed text-slate-300 mb-12 font-medium">
              {settings?.cta_description || "Bergabunglah dengan ratusan klien yang telah memercayakan proyek desain mereka kepada kami. Mulai konsultasi gratis Anda hari ini."}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-14 w-full sm:w-auto items-center justify-center gap-2.5 rounded-full bg-white px-8 text-base font-bold text-slate-900 transition-all hover:bg-primary hover:text-white shadow-sm"
              >
                <MessageCircle size={18} />
                {settings?.cta_button1_text || "Mulai Konsultasi"}
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </a>
              <a
                href="#semua-layanan"
                className="flex h-14 w-full sm:w-auto items-center justify-center rounded-full border-2 border-white/20 bg-transparent px-8 text-base font-bold text-white transition-all hover:bg-white/10 hover:border-white/30"
              >
                {settings?.cta_button2_text || "Lihat Layanan"}
              </a>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}