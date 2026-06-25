import Link from "next/link";
import FadeIn from "./FadeIn";
import { ArrowRight, BriefcaseBusiness, MessageCircle } from "lucide-react";

export default function AllServices({ settings, services }: { settings?: any; services?: any[] }) {
  if (!services || services.length === 0) return null;

  const displayServices = services.slice(0, 6);

  return (
    <section className="bg-slate-50 py-24 sm:py-32" id="semua-layanan">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn delay={100} className="mx-auto max-w-2xl text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary mb-4">
            <BriefcaseBusiness className="w-4 h-4" />
            <span>{settings?.all_services_badge || "Layanan Kami"}</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {settings?.all_services_title || "Semua Layanan"}
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            {settings?.all_services_description || "Temukan layanan yang paling sesuai dengan kebutuhan bisnis Anda."}
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayServices.map((service, idx) => {
            const minPrice = service.packages?.length > 0
              ? Math.min(...service.packages.map((p: any) => Number(p.price) || 0))
              : 0;

            const waNumber = (settings?.phone_number || "").replace(/\D/g, "");
            const waText = encodeURIComponent(`Halo, saya tertarik dengan layanan ${service.title}. Boleh minta info lebih lanjut?`);
            const waHref = waNumber ? `https://wa.me/${waNumber}?text=${waText}` : `https://wa.me/?text=${waText}`;

            return (
              <FadeIn key={service.id} delay={150 + idx * 80}>
                <article className="group relative flex flex-col bg-white rounded-2xl ring-1 ring-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden h-full">

                  <div className="relative aspect-video overflow-hidden bg-slate-100">
                    {service.thumbnail_url ? (
                      <img
                        src={service.thumbnail_url}
                        alt={service.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <BriefcaseBusiness className="w-10 h-10" />
                      </div>
                    )}
                    {service.category && (
                      <div className="absolute top-3 left-3">
                        <span className="rounded-full bg-white/90 backdrop-blur-sm px-3 py-1 text-xs font-bold text-primary shadow-sm">
                          {service.category.trim()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col flex-1 p-6">
                    <Link href={`/services/${service.slug}`}>
                      <h2 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {service.title}
                      </h2>
                    </Link>
                    {service.description && (
                      <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 mb-5 flex-1">
                        {service.description}
                      </p>
                    )}

                    <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Mulai dari</span>
                        <p className="text-base font-extrabold text-slate-900">
                          {minPrice > 0 ? `Rp ${minPrice.toLocaleString("id-ID")}` : "Hubungi Kami"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/services/${service.slug}`}
                          className="h-9 w-9 flex items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:border-primary hover:text-primary transition-colors"
                        >
                          <ArrowRight size={16} />
                        </Link>
                        <a
                          href={waHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-9 flex items-center gap-1.5 rounded-full bg-primary text-white px-3.5 text-xs font-bold hover:bg-secondary transition-colors"
                        >
                          <MessageCircle size={13} />
                          Pesan
                        </a>
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
