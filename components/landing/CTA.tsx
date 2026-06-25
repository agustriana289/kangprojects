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
          <div className="relative isolate overflow-hidden bg-gradient-to-br from-purple-100/80 via-white to-orange-50/80 rounded-[3rem] px-6 py-20 lg:px-20 lg:py-24 shadow-sm border border-slate-100 flex flex-col lg:flex-row items-center justify-between gap-16">
            
            {/* Abstract Graphic Element (Left Side) */}
            <div className="hidden lg:flex w-1/2 relative h-[300px] items-center justify-center">
               <div className="absolute top-0 left-0 w-64 h-64 bg-purple-200/50 rounded-full blur-3xl opacity-60"></div>
               <div className="absolute bottom-0 right-0 w-64 h-64 bg-orange-200/50 rounded-full blur-3xl opacity-60"></div>
               
               {/* Two overlapping elegant abstract cards */}
               <div className="relative z-10 w-48 h-64 bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/50 -rotate-6 transform translate-x-8 flex items-center justify-center">
                 <MessageCircle size={48} className="text-purple-300" />
               </div>
               <div className="relative z-20 w-56 h-72 bg-gradient-to-br from-white to-slate-50 rounded-3xl shadow-2xl border border-white rotate-3 transform -translate-x-8 flex items-center justify-center">
                 <ArrowRight size={48} className="text-primary" />
               </div>
            </div>

            {/* Text Content (Right Side) */}
            <div className="w-full lg:w-1/2 text-center lg:text-left z-10">
              <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl mb-8">
                {settings?.cta_title || "Siap membangun identitas yang kuat?"}
              </h2>
              <p className="text-lg sm:text-xl leading-relaxed text-slate-500 mb-10 font-medium">
                {settings?.cta_description || "Bergabunglah dengan ratusan klien yang telah memercayakan proyek desain mereka kepada kami. Mulai konsultasi gratis Anda hari ini."}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex h-14 w-full sm:w-auto items-center justify-center gap-2.5 rounded-full bg-primary px-8 text-base font-bold text-white transition-all hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5"
                >
                  <MessageCircle size={18} />
                  {settings?.cta_button1_text || "Mulai Konsultasi"}
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </a>
                <a
                  href="#semua-layanan"
                  className="flex h-14 w-full sm:w-auto items-center justify-center rounded-full border-2 border-slate-200 bg-white/50 backdrop-blur-sm px-8 text-base font-bold text-slate-700 transition-all hover:bg-white hover:border-slate-300"
                >
                  {settings?.cta_button2_text || "Lihat Layanan"}
                </a>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}