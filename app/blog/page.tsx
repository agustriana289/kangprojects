import { createClient } from "@/utils/supabase/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FadeIn from "@/components/landing/FadeIn";
import Link from "next/link";
import { Calendar, ArrowRight, BookOpen } from "lucide-react";

import Pagination from "@/components/landing/Pagination";

export const revalidate = 60;

async function getBlogs(page: number, limit: number) {
  const supabase = await createClient();
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, count } = await supabase
    .from("blogs")
    .select("id, title, slug, excerpt, category, featured_image, published_at", { count: "exact" })
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .range(from, to);
    
  return { data: data || [], total: count || 0 };
}

export default async function BlogPage(props: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const pageStr = searchParams?.page;
  const page = typeof pageStr === "string" ? parseInt(pageStr, 10) : 1;
  const limit = 9;

  const supabase = await createClient();
  const { data: blogs, total } = await getBlogs(page, limit);
  const totalPages = Math.ceil(total / limit);
  const { data: settingsData } = await supabase.from("settings").select("blog_badge, blog_title, blog_description").eq("id", 1).single();
  const settings = settingsData || {};

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <Header />

      <div className="pt-8 pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn delay={100} className="max-w-2xl mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-medium text-primary mb-6">
              <BookOpen size={14} />
              <span>{(settings as any).blog_badge || "Artikel Terbaru"}</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl mb-4">
              {(settings as any).blog_title || "Inspirasi & Tips Desain"}
            </h1>
            <p className="text-lg text-slate-600">
              {(settings as any).blog_description || "Baca berbagai insight tentang desain logo, branding, dan tren desain grafis yang relevan untuk bisnis anda."}
            </p>
          </FadeIn>

          {blogs.length === 0 ? (
            <FadeIn delay={200} className="text-center py-32 rounded-3xl bg-slate-50 ring-1 ring-slate-100">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">Belum ada artikel yang dipublikasikan.</p>
              <p className="text-slate-400 text-sm mt-1">Periksa kembali nanti untuk artikel baru.</p>
            </FadeIn>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogs.map((blog, idx) => (
                <FadeIn key={blog.id} delay={150 + idx * 80}>
                  <article className="group relative flex flex-col bg-white rounded-3xl ring-1 ring-slate-100/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden h-full">
                    <div className="relative aspect-video overflow-hidden">
                      {blog.featured_image ? (
                        <img
                          src={blog.featured_image}
                          alt={blog.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
                          <BookOpen className="w-10 h-10" />
                        </div>
                      )}
                      {blog.category && (
                        <div className="absolute top-4 left-4 flex flex-wrap gap-1">
                          {blog.category.split(",").slice(0, 2).map((cat: string) => (
                            <span key={cat.trim()} className="rounded-full bg-white/90 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-slate-900 shadow-sm">
                              {cat.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col flex-1 p-6">
                      <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                        <Calendar size={13} />
                        <time>{new Date(blog.published_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</time>
                      </div>
                      <h2 className="text-lg font-bold text-slate-900 leading-snug mb-3 group-hover:text-primary transition-colors line-clamp-2">
                        {blog.title}
                      </h2>
                      {blog.excerpt && (
                        <p className="text-sm text-slate-500 leading-relaxed line-clamp-3 mb-6 flex-1">
                          {blog.excerpt}
                        </p>
                      )}
                      <div className="mt-auto">
                        <Link
                          href={`/blog/${blog.slug}`}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary transition-colors"
                        >
                          Baca artikel <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
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