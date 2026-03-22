import { createClient } from "@/utils/supabase/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FadeIn from "@/components/landing/FadeIn";
import CategoryFilter from "@/components/landing/CategoryFilter";
import SearchBar from "@/components/landing/SearchBar";
import Pagination from "@/components/landing/Pagination";
import { BriefcaseBusiness, Eye } from "lucide-react";

export const revalidate = 60;

async function getCategories() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_portfolios")
    .select("category")
    .eq("is_published", true)
    .not("category", "is", null);

  const unique = Array.from(
    new Set((data || []).map((r: any) => r.category?.trim()).filter(Boolean))
  ) as string[];
  return unique.sort();
}

async function getPortfolios(page: number, limit: number, category: string, q: string) {
  const supabase = await createClient();
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("store_portfolios")
    .select("id, title, description, category, images, tags", { count: "exact" })
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (category) query = query.eq("category", category);
  if (q) query = query.ilike("title", `%${q}%`);

  const { data, count } = await query.range(from, to);
  return { data: data || [], total: count || 0 };
}

export default async function PortfoliosPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const pageStr = searchParams?.page;
  const page = typeof pageStr === "string" ? parseInt(pageStr, 10) : 1;
  const categoryParam = typeof searchParams?.category === "string" ? searchParams.category : "";
  const q = typeof searchParams?.q === "string" ? searchParams.q : "";
  const limit = 9;

  const supabase = await createClient();
  const [{ data: portfolios, total }, categories] = await Promise.all([
    getPortfolios(page, limit, categoryParam, q),
    getCategories(),
  ]);
  const totalPages = Math.ceil(total / limit);
  const { data: settingsData } = await supabase
    .from("settings")
    .select("portfolio_badge, portfolio_title, portfolio_description")
    .eq("id", 1)
    .single();
  const settings = settingsData || {};

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <Header />

      <div className="pt-8 pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn delay={100} className="max-w-2xl mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-medium text-primary mb-6">
              <BriefcaseBusiness size={14} />
              <span>{(settings as any).portfolio_badge || "Karya Kami"}</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl mb-4">
              {categoryParam
                ? categoryParam
                : (settings as any).portfolio_title || "Portofolio Kreatif"}
            </h1>
            <p className="text-lg text-slate-600">
              {categoryParam
                ? `Menampilkan semua karya dalam kategori "${categoryParam}".`
                : (settings as any).portfolio_description ||
                  "Temukan proyek terbaru dan solusi desain sukses yang telah kami kerjakan untuk klien kami."}
            </p>
          </FadeIn>

          {categories.length > 0 && (
            <FadeIn delay={150}>
              <CategoryFilter categories={categories} activeCategory={categoryParam} />
            </FadeIn>
          )}

          <FadeIn delay={180}>
            <SearchBar placeholder="Cari portofolio..." />
          </FadeIn>

          {portfolios.length === 0 ? (
            <FadeIn delay={200} className="text-center py-32 rounded-3xl bg-slate-50 ring-1 ring-slate-100">
              <BriefcaseBusiness className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">
                {q
                  ? `Tidak ada portofolio yang cocok dengan "${q}".`
                  : categoryParam
                  ? `Belum ada portofolio dalam kategori "${categoryParam}".`
                  : "Belum ada portofolio yang dipublikasikan."}
              </p>
              <p className="text-slate-400 text-sm mt-1">Kunjungi kembali nanti untuk pembaruan terbaru kami.</p>
            </FadeIn>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {portfolios.map((portfolio, idx) => (
                <FadeIn key={portfolio.id} delay={150 + idx * 80}>
                  <article className="group relative flex flex-col bg-white rounded-3xl ring-1 ring-slate-100/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden h-full">
                    <div className="relative aspect-square overflow-hidden bg-slate-100">
                      {portfolio.images && portfolio.images.length > 0 ? (
                        <img
                          src={portfolio.images[0]}
                          alt={portfolio.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <Eye className="w-10 h-10" />
                        </div>
                      )}
                      {portfolio.category && (
                        <div className="absolute top-4 left-4 flex flex-wrap gap-1">
                          <span className="rounded-full bg-white/90 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-primary shadow-sm">
                            {portfolio.category.trim()}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col flex-1 p-6">
                      <h2 className="text-xl font-bold text-slate-900 leading-snug mb-3 group-hover:text-primary transition-colors line-clamp-2">
                        {portfolio.title}
                      </h2>
                      {portfolio.description && (
                        <p className="text-sm text-slate-500 leading-relaxed line-clamp-3 mb-6 flex-1">
                          {portfolio.description}
                        </p>
                      )}

                      {portfolio.tags && portfolio.tags.length > 0 && (
                        <div className="mt-auto flex flex-wrap gap-2 pt-4 border-t border-slate-100">
                          {portfolio.tags.slice(0, 3).map((tag: string, i: number) => (
                            <span key={i} className="text-xs font-semibold px-2.5 py-1 bg-slate-50 text-slate-600 rounded-lg">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
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