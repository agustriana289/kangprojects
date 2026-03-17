"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Plus, BookOpen, Globe, FileEdit, Trash2, ChevronLeft, ChevronRight, Loader2, CheckCircle2, Clock, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ToastProvider";

interface Blog {
  id: string;
  title: string;
  slug: string;
  category: string;
  featured_image: string | null;
  is_published: boolean;
  updated_at: string;
}

export default function BlogsClient() {
  const supabase = createClient();
  const { showToast } = useToast();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | "published" | "draft">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("blogs")
        .select("id, title, slug, category, featured_image, is_published, updated_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (data) setBlogs(data);
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  }, [supabase, showToast]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  const deleteBlog = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus postingan blog ini?")) return;
    try {
      const { error } = await supabase.from("blogs").delete().eq("id", id);
      if (error) throw error;
      showToast("Postingan blog dihapus.", "success");
      fetchBlogs();
    } catch (error: any) {
      showToast(error.message, "error");
    }
  };

  const filteredBlogs = blogs.filter(b => {
    const matchesSearch = b.title.toLowerCase().includes(search.toLowerCase()) || (b.category || "").toLowerCase().includes(search.toLowerCase());
    const matchesTab = tab === "all" || (tab === "published" ? b.is_published : !b.is_published);
    return matchesSearch && matchesTab;
  });

  const paginatedBlogs = filteredBlogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(filteredBlogs.length / pageSize);

  if (loading && blogs.length === 0) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="pt-6 px-4 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Manajemen Blog</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Kelola dan publikasikan artikel untuk audiens Anda.</p>
        </div>
        <Link
          href="/dashboard/blogs/new"
          className="inline-flex items-center gap-2 bg-primary hover:bg-secondary text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-sm shadow-indigo-200 transition-colors w-fit"
        >
          <Plus className="w-4 h-4" />
          Postingan Baru
        </Link>
      </div>

      <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-slate-100">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Cari berdasarkan judul atau kategori..."
              className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-secondary transition-all"
            />
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
            {(["semua", "diterbitkan", "draf"] as const).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t === "semua" ? "all" : t === "diterbitkan" ? "published" : "draft"); setCurrentPage(1); }}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${((tab === "all" && t === "semua") || (tab === "published" && t === "diterbitkan") || (tab === "draft" && t === "draf")) ? "bg-white text-primary shadow-sm ring-1 ring-slate-200/50" : "text-slate-500 hover:text-slate-800"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4">Artikel</th>
                <th className="px-6 py-4">Kategori</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Pembaruan Terakhir</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedBlogs.map(blog => (
                <tr key={blog.id} className="hover:bg-slate-50/60 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                        {blog.featured_image ? (
                          <img src={blog.featured_image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <ImageIcon className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-sm truncate max-w-xs">{blog.title}</p>
                        <p className="text-xs font-medium text-slate-400 truncate mt-0.5">/blog/{blog.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {blog.category || <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-6 py-4">
                    {blog.is_published ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-100">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Diterbitkan
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-xs font-bold">
                        <Clock className="w-3.5 h-3.5" /> Draf
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-500">
                    {new Date(blog.updated_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/blog/${blog.slug}`} target="_blank" className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-primary transition-colors" title="Lihat halaman publik">
                        <Globe className="w-4 h-4" />
                      </Link>
                      <Link href={`/dashboard/blogs/${blog.id}/edit`} className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-primary transition-colors" title="Ubah">
                        <FileEdit className="w-4 h-4" />
                      </Link>
                      <button onClick={() => deleteBlog(blog.id)} className="p-2 rounded-lg bg-slate-100 text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-colors" title="Hapus">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedBlogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <BookOpen className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-400">Tidak ada postingan blog ditemukan.</p>
                    <p className="text-xs text-slate-400 mt-1">Buat postingan pertama Anda untuk memulai.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Menampilkan {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredBlogs.length)} dari {filteredBlogs.length} Artikel
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 transition-all shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .reduce<(number | "...")[]>((acc, p, i, arr) => {
                if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) => p === "..." ? (
                <span key={`ellipsis-${i}`} className="px-2 text-slate-400 text-sm font-bold">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p as number)}
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${currentPage === p ? "bg-primary text-white shadow-indigo-200 shadow-md" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                >
                  {p}
                </button>
              ))}
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 transition-all shadow-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}