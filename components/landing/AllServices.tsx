import Link from "next/link";
import FadeIn from "./FadeIn";
import { ArrowRight, BriefcaseBusiness, MessageCircle } from "lucide-react";

export default function AllServices({ settings, services }: { settings?: any; services?: any[] }) {
  if (!services || services.length === 0) return null;

  const displayServices = services.slice(0, 6);

  return (
    <section className="bg-white py-24 sm:py-32" id="semua-layanan">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn delay={100} className="mx-auto max-w-3xl text-center mb-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-600 mb-6">
            <BriefcaseBusiness className="w-4 h-4 text-primary" />
            <span>{settings?.all_services_badge || "Layanan Kami"}</span>
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            {settings?.all_services_title || "Layanan Profesional"}
          </h2>
          <p className="mt-6 text-lg leading-8 text-slate-500">
            {settings?.all_services_description || "Temukan layanan desain dan pengembangan yang dirancang khusus untuk meningkatkan nilai merek dan bisnis Anda."}
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayServices.map((service, idx) => {
            const minPrice = service.packages?.length > 0
              ? Math.min(...service.packages.map((p: any) => Number(p.price) || 0))
              : 0;

            const waNumber = (settings?.phone_number || "").replace(/\D/g, "");
            const waText = encodeURIComponent(`Halo, saya tertarik dengan layanan ${service.title}. Boleh minta info lebih lanjut?`);
            const waHref = waNumber ? `https://wa.me/${waNumber}?text=${waText}` : `https://wa.me/?text=${waText}`;

            return (
              <FadeIn key={service.id} delay={150 + idx * 100}>
                <article className="group flex flex-col bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-slate-300 hover:-translate-y-1 transition-all duration-300 overflow-hidden h-full">
                  
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                    {service.thumbnail_url ? (
                      <img
                        src={service.thumbnail_url}
                        alt={service.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <BriefcaseBusiness className="w-12 h-12" />
                      </div>
                    )}
                    {service.category && (
                      <div className="absolute top-4 left-4">
                        <span className="rounded-full bg-white/95 backdrop-blur-md px-3 py-1.5 text-xs font-bold text-slate-900 shadow-sm">
                          {service.category.trim()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col flex-1 p-8">
                    <Link href={`/services/${service.slug}`}>
                      <h3 className="text-xl font-bold tracking-tight text-slate-900 mb-3 group-hover:text-primary transition-colors line-clamp-2">
                        {service.title}
                      </h3>
                    </Link>
                    {service.description && (
                      <p className="text-base text-slate-500 leading-relaxed line-clamp-2 mb-8 flex-1">
                        {service.description}
                      </p>
                    )}

                    <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between gap-4">
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">Mulai dari</span>
                        <p className="text-lg font-bold text-slate-900">
                          {minPrice > 0 ? `Rp ${minPrice.toLocaleString("id-ID")}` : "Hubungi Kami"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={waHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-10 flex items-center gap-2 rounded-full bg-slate-900 text-white px-4 text-sm font-bold hover:bg-primary transition-colors"
                        >
                          <MessageCircle size={16} />
                          <span className="hidden sm:inline">Pesan</span>
                        </a>
                        <Link
                          href={`/services/${service.slug}`}
                          className="h-10 w-10 flex items-center justify-center rounded-full border border-slate-200 text-slate-700 hover:border-slate-400 transition-colors"
                          aria-label="Lihat Detail"
                        >
                          <ArrowRight size={18} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
