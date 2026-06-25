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
    <section className="bg-slate-950 py-24 sm:py-32" id="testimonials">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn delay={100} className="mb-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-medium text-white/70 mb-4">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>{settings?.testimonial_badge || "Kisah Sukses"}</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {settings?.testimonial_title || "Apa kata klien kami"}
          </h2>
          <p className="mt-4 text-lg text-white/50 max-w-2xl mx-auto">
            {settings?.testimonial_description || "Jangan hanya percaya kata-kata kami. Berikut adalah apa yang dikatakan merek tentang karya kami."}
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.slice(0, 6).map((t, idx) => {
            const avgStars = Math.round((t.rating_quality + t.rating_communication + t.rating_speed) / 3 || 5);
            return (
              <FadeIn key={t.id || idx} delay={100 + (idx % 3) * 100}>
                <div className="flex flex-col h-full rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-sm hover:bg-white/8 hover:border-white/20 transition-all duration-300">
                  <Quote className="w-8 h-8 text-primary/50 mb-4 shrink-0" />

                  <p className="text-white/70 text-sm leading-relaxed line-clamp-4 flex-1 mb-6 italic">
                    {t.comment}
                  </p>

                  <div className="flex items-center gap-3 pt-4 border-t border-white/10 mt-auto">
                    <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm shrink-0 border border-primary/30">
                      {t.client_name ? t.client_name.substring(0, 2).toUpperCase() : "AA"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-white truncate">{t.client_name || "Klien Anonim"}</h4>
                      <p className="text-xs text-white/40 truncate">{getProjectTitle(t)}</p>
                    </div>
                    <div className="flex text-amber-400 shrink-0">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={12}
                          fill={i < avgStars ? "currentColor" : "transparent"}
                          strokeWidth={i < avgStars ? 0 : 2}
                          className={i < avgStars ? "" : "text-amber-400/30"}
                        />
                      ))}
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