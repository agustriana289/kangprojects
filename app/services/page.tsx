import { createClient } from "@/utils/supabase/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FadeIn from "@/components/landing/FadeIn";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, CheckCircle2 } from "lucide-react";
import Pagination from "@/components/landing/Pagination";

export const revalidate = 60;

async function getServices(page: number, limit: number) {
  const supabase = await createClient();
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, count } = await supabase
    .from("store_services")
    .select("id, title, slug, description, category, thumbnail_url, packages", { count: "exact" })
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .range(from, to);
    
  return { data: data || [], total: count || 0 };
}

export default async function ServicesPage(props: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const pageStr = searchParams?.page;
  const page = typeof pageStr === "string" ? parseInt(pageStr, 10) : 1;
  const limit = 9;

  const supabase = await createClient();
  const { data: services, total } = await getServices(page, limit);
  const totalPages = Math.ceil(total / limit);
  const { data: settingsData } = await supabase.from("settings").select("all_services_badge, all_services_title, all_services_description").eq("id", 1).single();
  const settings = settingsData || {};

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <Header />

      <div className="pt-8 pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn delay={100} className="max-w-2xl mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-medium text-primary mb-6">
              <BriefcaseBusiness size={14} />
              <span>{(settings as any).all_services_badge || "Layanan Kami"}</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl mb-4">
              {(settings as any).all_services_title || "Solusi Desain Profesional"}
            </h1>
            <p className="text-lg text-slate-600">
              {(settings as any).all_services_description || "Tingkatkan identitas brand Anda melalui layanan desain, strategi, dan pengembangan yang dirancang khusus untuk kebutuhan bisnis modern."}
            </p>
          </FadeIn>

          {services.length === 0 ? (
            <FadeIn delay={200} className="text-center py-32 rounded-3xl bg-slate-50 ring-1 ring-slate-100">
              <BriefcaseBusiness className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">Saat ini belum ada layanan yang dipublikasikan.</p>
              <p className="text-slate-400 text-sm mt-1">Silakan periksa kembali nanti atau hubungi kami langsung.</p>
            </FadeIn>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service, idx) => (
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
                      <Link
                          href={`/services/${service.slug}`}
                        >
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
                            Rp {Number(service.packages?.[0]?.price || 0).toLocaleString('id-ID')}
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
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <Pagination totalPages={totalPages} currentPage={page} />
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}