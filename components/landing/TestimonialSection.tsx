"use client";

import { Star } from "lucide-react";
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
    <section className="bg-slate-50 py-24 sm:py-32" id="testimonials">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn delay={100} className="mb-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-medium text-primary mb-4">
            <Star className="w-4 h-4" />
            <span>{settings?.testimonial_badge || "Kisah Sukses"}</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {settings?.testimonial_title || "Apa kata klien kami"}
          </h2>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            {settings?.testimonial_description || "Jangan hanya percaya kata-kata kami. Berikut adalah apa yang dikatakan merek tentang karya kami."}
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.slice(0, 6).map((t, idx) => (
            <FadeIn key={t.id || idx} delay={100 + (idx % 3) * 100} className="bg-white rounded-3xl p-8 shadow-sm ring-1 ring-slate-100 flex flex-col h-full">
              <div className="flex text-amber-400 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    fill={i < Math.round((t.rating_quality + t.rating_communication + t.rating_speed) / 3 || 5) ? "currentColor" : "transparent"}
                    strokeWidth={i < Math.round((t.rating_quality + t.rating_communication + t.rating_speed) / 3 || 5) ? 0 : 2}
                    className={i < Math.round((t.rating_quality + t.rating_communication + t.rating_speed) / 3 || 5) ? "" : "text-amber-200"}
                  />
                ))}
              </div>
              <p className="text-slate-700 font-medium italic mb-6 grow line-clamp-4">
                &quot;{t.comment}&quot;
              </p>
              <div className="flex items-center gap-3 pt-6 border-t border-slate-100 mt-auto">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                  {t.client_name ? t.client_name.substring(0, 2).toUpperCase() : "AA"}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{t.client_name || "Klien Anonim"}</h4>
                  <p className="text-xs text-slate-500">{getProjectTitle(t)}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}