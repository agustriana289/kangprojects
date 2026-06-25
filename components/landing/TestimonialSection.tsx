"use client";

import { Star, Quote } from "lucide-react";
import FadeIn from "./FadeIn";

function getProjectTitle(t: any): string {
  if (t.custom_project_title) return t.custom_project_title;
  const order = t.store_orders;
  if (!order) return "Klien Terverifikasi";
  const baseTitle = order.store_products?.title || order.store_services?.title || "";
  try {
    const fd = typeof order.form_data === "string" ? JSON.parse(order.form_data) : order.form_data;
    const note = fd?.["project_title"] || fd?.["Project Title"] || fd?.["Nama Logo"] || fd?.["nama_logo"];
    if (note) return note;
  } catch {
    return baseTitle || "Klien Terverifikasi";
  }
  return baseTitle || "Klien Terverifikasi";
}

export default function TestimonialSection({ settings, testimonials = [] }: { settings?: any, testimonials?: any[] }) {
  if (!testimonials || testimonials.length === 0) return null;

  return (
    <section className="bg-white py-24 sm:py-32" id="testimonials">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn delay={100} className="text-left mb-20 max-w-3xl">
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            {settings?.testimonial_title || "Pengalaman Nyata Dari Klien Kami"}
          </h2>
          <p className="mt-6 text-lg leading-8 text-slate-500">
            {settings?.testimonial_description || "Jangan hanya mendengar dari kami. Dengarkan langsung dari klien-klien yang telah merasakan dampak nyata dari layanan kami."}
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.slice(0, 6).map((t, idx) => {
            const avgStars = Math.round((t.rating_quality + t.rating_communication + t.rating_speed) / 3 || 5);
            return (
              <FadeIn key={t.id || idx} delay={100 + (idx % 3) * 100}>
                <div className="relative flex flex-col h-full rounded-3xl bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
                  <div className="absolute top-8 right-8 text-primary/10">
                    <Quote size={48} className="rotate-180" />
                  </div>
                  
                  <div className="flex text-amber-400 mb-6 relative z-10">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        fill={i < avgStars ? "currentColor" : "transparent"}
                        strokeWidth={i < avgStars ? 0 : 2}
                        className={i < avgStars ? "" : "text-amber-200"}
                      />
                    ))}
                  </div>

                  <p className="text-slate-700 text-base leading-relaxed line-clamp-4 flex-1 mb-8 relative z-10">
                    "{t.comment}"
                  </p>

                  <div className="flex items-center gap-4 mt-auto relative z-10">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-50 to-orange-50 text-primary flex items-center justify-center font-bold text-sm shrink-0 shadow-inner">
                      {t.client_name ? t.client_name.substring(0, 2).toUpperCase() : "AA"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-bold text-slate-900 truncate">{t.client_name || "Klien Anonim"}</h4>
                      <p className="text-sm text-slate-500 truncate">{getProjectTitle(t)}</p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}