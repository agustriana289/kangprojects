import Link from "next/link";
import FadeIn from "./FadeIn";
import { ArrowRight, BriefcaseBusiness } from "lucide-react";

export default function AllServices({ settings, services }: { settings?: any; services?: any[] }) {
  if (!services || services.length === 0) return null;

  const displayServices = services.slice(0, 6);

  return (
    <section className="bg-slate-50 py-24 sm:py-32" id="semua-layanan">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn delay={100} className="mx-auto max-w-4xl text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-medium text-primary mb-4">
            <BriefcaseBusiness className="w-4 h-4" />
            <span>{settings?.all_services_badge || "Layanan Kami"}</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            {settings?.all_services_title || "Semua Layanan"}
          </h2>
          <p className="mt-6 text-xl leading-8 text-slate-600">
            {settings?.all_services_description || "Temukan paket desain yang paling sesuai dengan kebutuhan bisnis Anda."}
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayServices.map((service, idx) => {
            const minPrice = service.packages?.length > 0 
              ? Math.min(...service.packages.map((p: any) => Number(p.price) || 0)) 
              : 0;

            return (
              <FadeIn key={service.id} delay={150 + idx * 80}>
                <article className="group relative flex flex-col bg-white rounded-3xl ring-1 ring-slate-100/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden h-full">
                  <div className="relative aspect-video overflow-hidden">
                    {service.thumbnail_url ? (
                      <img
                        src={service.thumbnail_url}
                        alt={service.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
                        <BriefcaseBusiness className="w-10 h-10" />
                      </div>
                    )}
                    {service.category && (
                      <div className="absolute top-4 left-4 flex flex-wrap gap-1">
                        <span className="rounded-full bg-white/90 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-primary shadow-sm">
                          {service.category.trim()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col flex-1 p-6">
                    <Link href={`/services/${service.slug}`}>
                      <h2 className="text-xl font-bold text-slate-900 leading-snug mb-3 group-hover:text-primary transition-colors line-clamp-2">
                        {service.title}
                      </h2>
                    </Link>
                    {service.description && (
                      <p className="text-sm text-slate-500 leading-relaxed line-clamp-3 mb-6 flex-1">
                        {service.description}
                      </p>
                    )}

                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-400">Mulai dari</span>
                        <span className="text-lg font-bold tracking-tight text-slate-900">
                          {minPrice > 0 ? `Rp ${minPrice.toLocaleString('id-ID')}` : 'Hubungi Kami'}
                        </span>
                      </div>
                      <Link
                        href={`/services/${service.slug}`}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-600 group-hover:bg-primary group-hover:text-white transition-all shadow-sm group-hover:shadow-md"
                      >
                        <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
                      </Link>
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
