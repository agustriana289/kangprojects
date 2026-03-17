import { ArrowRight } from "lucide-react";
import FadeIn from "./FadeIn";

export default function CTA({ settings }: { settings?: any }) {
  return (
    <section className="bg-white py-16 sm:py-24" id="cta">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn delay={100}>
          <div className="relative isolate overflow-hidden bg-slate-900 px-6 py-24 text-center shadow-2xl rounded-3xl sm:px-16">
            <h2 className="mx-auto max-w-2xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
              {settings?.cta_title || "Siap untuk meningkatkan merek Anda?"}
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-slate-300">
              {settings?.cta_description || "Bergabunglah dengan ribuan bisnis sukses yang memercayakan identitas visual mereka kepada kami. Mulai proyek Anda hari ini dan dapatkan konsep awal Anda dalam waktu 24 jam."}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6">
              <a
                href={settings?.cta_button1_url || "/shop"}
                className="group flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-semibold text-white shadow-sm hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-all duration-300 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-1 w-full sm:w-auto"
              >
                {settings?.cta_button1_text || "Ayo mulai"}
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </a>
              <a href={settings?.cta_button2_url || "/contact"} className="flex items-center justify-center gap-2 text-base font-semibold leading-6 text-white transition-colors hover:text-primary w-full sm:w-auto py-2">
                {settings?.cta_button2_text || "Bicara dengan tim kami"}
              </a>
            </div>
            
            

            <svg
              viewBox="0 0 1024 1024"
              className="absolute left-1/2 top-1/2 -z-10 h-256 w-5xl -translate-x-1/2 mask-[radial-gradient(closest-side,white,transparent)]"
              aria-hidden="true"
            >
              <circle cx={512} cy={512} r={512} fill="url(#gradient)" fillOpacity="0.7" />
              <defs>
                <radialGradient id="gradient">
                  <stop stopColor="#818cf8" />
                  <stop offset={1} stopColor="#4338ca" />
                </radialGradient>
              </defs>
            </svg>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}