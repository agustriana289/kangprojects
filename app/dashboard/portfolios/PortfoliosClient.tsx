"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { Plus, Search, Edit, Trash2, Image as ImageIcon, Loader2, X, Eye, EyeOff, Star, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ToastProvider";
import ImageUploader from "@/components/admin/ImageUploader";

const EMPTY_FORM = {
  title: "",
  description: "",
  category: "",
  images: [] as string[],
  tags: [] as string[],
  is_published: true,
  is_favorite: false,
  order_id: null as string | null,
};

const PAGE_SIZE = 12;

export default function PortfoliosClient() {
  const supabase = createClient();
  const { showToast } = useToast();
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [tagInput, setTagInput] = useState("");
  const [page, setPage] = useState(1);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [categoryDraft, setCategoryDraft] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  const getFormData = (o: any) => {
    try { return typeof o.form_data === "string" ? JSON.parse(o.form_data) : (o.form_data || {}); }
    catch { return {}; }
  };

  const getProjectTitle = (o: any) => {
    const fd = getFormData(o) || {};
    const projectNote = fd["project_title"] || fd["Project Title"] || fd["Nama Logo"] || fd["nama_logo"] || "";
    if (projectNote) return projectNote;

    const baseTitle = o.store_services?.title || o.store_products?.title || o.custom_item_name || fd.custom_item_name || "";
    let pkgName = "";
    try {
      if (typeof o.selected_package === "string") {
        try { pkgName = JSON.parse(o.selected_package)?.name || ""; } catch { pkgName = o.selected_package; }
      } else {
        pkgName = o.selected_package?.name || "";
      }
    } catch { /* ignore */ }
    
    if (!pkgName) pkgName = o.custom_package_name || fd.custom_package_name || "";

    if (baseTitle && pkgName) return `${baseTitle} (${pkgName})`;
    if (baseTitle) return baseTitle;
    if (pkgName) return pkgName;
    return fd.customer_name || "Project";
  };

  const getClientName = (o: any) => {
    if (o.client?.full_name) return o.client.full_name;
    if (o.client?.email) return o.client.email.split("@")[0];
    if (o.guest_name) return o.guest_name;
    const fd = getFormData(o);
    return fd.customer_name || fd["Client Name"] || "Unknown Client";
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
        setActiveCategoryId(null);
        setCategoryDraft("");
        setDropdownPos(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const updateCategory = async (id: string, category: string) => {
    const trimmed = category.trim();
    if (!trimmed) return;
    setSavingCategory(true);
    const { error } = await supabase.from("store_portfolios").update({ category: trimmed }).eq("id", id);
    if (error) showToast(error.message, "error");
    else { fetchPortfolios(); showToast("Kategori diperbarui", "success"); }
    setActiveCategoryId(null);
    setCategoryDraft("");
    setDropdownPos(null);
    setSavingCategory(false);
  };

  const fetchPortfolios = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("store_portfolios")
      .select("*, store_orders(order_number, id, form_data, selected_package, store_services(title, category), store_products(title, category))")
      .order("created_at", { ascending: false });
    if (error) showToast(error.message, "error");
    else setPortfolios(data || []);
    setLoading(false);
  }, [supabase, showToast]);

  const fetchProjects = useCallback(async () => {
    setLoadingProjects(true);
    const { data: profiles } = await supabase.from("users").select("id, full_name, email");
    const profileMap: Record<string, any> = {};
    (profiles || []).forEach((p: any) => { if (p.id) profileMap[p.id] = p; });

    const { data, error } = await supabase
      .from("store_orders")
      .select("*, store_services(title, category), store_products(title, category)")
      .order("created_at", { ascending: false });
    
    if (!error && data) {
      setProjects(data.map((o: any) => ({
        ...o,
        client: profileMap[o.user_id] || null
      })));
    }
    setLoadingProjects(false);
  }, [supabase]);

  useEffect(() => { 
    fetchPortfolios(); 
    fetchProjects();
  }, [fetchPortfolios, fetchProjects]);

  const handleProjectSelect = (projectId: string) => {
    if (!projectId) {
      setFormData(prev => ({ ...prev, order_id: null }));
      return;
    }

    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const title = getProjectTitle(project).split(' — ')[1] || getProjectTitle(project);
    const category = project.store_services?.category || project.store_products?.category || "";
    const description = `Portfolio for project ${getProjectTitle(project)}. Crafted for ${getClientName(project)}.`;
    const tags = category ? category.toLowerCase().split(' ') : [];

    setFormData(prev => ({
      ...prev,
      order_id: projectId,
      title: title || prev.title,
      category: category || prev.category,
      description: description || prev.description,
      tags: tags.length > 0 ? tags : prev.tags
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.images.length === 0) return showToast("Upload at least one image", "error");
    setSaving(true);
    const payload = { ...formData };
    const { error } = editingId
      ? await supabase.from("store_portfolios").update(payload).eq("id", editingId)
      : await supabase.from("store_portfolios").insert(payload);
    if (error) showToast(error.message, "error");
    else { showToast(editingId ? "Portofolio diperbarui!" : "Portofolio dibuat!", "success"); setIsModalOpen(false); fetchPortfolios(); }
    setSaving(false);
  };

  const deletePortfolio = async (id: string) => {
    if (!confirm("Hapus item portofolio ini?")) return;
    const { error } = await supabase.from("store_portfolios").delete().eq("id", id);
    if (error) showToast(error.message, "error");
    else { showToast("Dihapus", "success"); fetchPortfolios(); }
  };

  const toggleFavorite = async (p: any) => {
    if (!p.is_favorite) {
      const favCount = portfolios.filter(x => x.is_favorite).length;
      if (favCount >= 9) return showToast("Maksimal 9 item favorit diperbolehkan.", "error");
    }
    const { error } = await supabase.from("store_portfolios").update({ is_favorite: !p.is_favorite }).eq("id", p.id);
    if (error) showToast(error.message, "error");
    else fetchPortfolios();
  };

  const openAdd = () => { setFormData(EMPTY_FORM); setTagInput(""); setEditingId(null); setIsModalOpen(true); };
  const openEdit = (item: any) => {
    setFormData({ title: item.title, description: item.description || "", category: item.category || "", images: item.images || [], tags: item.tags || [], is_published: item.is_published, is_favorite: item.is_favorite || false, order_id: item.order_id });
    setTagInput("");
    setEditingId(item.id);
    setIsModalOpen(true);
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !formData.tags.includes(t)) setFormData(f => ({ ...f, tags: [...f.tags, t] }));
    setTagInput("");
  };

  const filtered = portfolios.filter(p =>
    p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const inputClass = "w-full bg-slate-50 border-0 text-slate-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-primary/20 p-3 transition-all outline-none";

  return (
    <div className="pt-6 px-4 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Portofolio</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Tampilkan proyek yang telah selesai kepada publik.</p>
        </div>
        <button onClick={openAdd}
          className="inline-flex items-center gap-2 bg-primary hover:bg-secondary text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-sm shadow-indigo-200 transition-colors">
          <Plus className="w-4 h-4" /> Tambah Portofolio
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Cari berdasarkan judul atau kategori..."
          className="w-full bg-white shadow-sm ring-1 ring-slate-100 border-0 rounded-2xl pl-9 pr-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20" />
      </div>

      {loading ? (
        <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-300 ring-1 ring-slate-100 rounded-2xl bg-white shadow-sm">
          <ImageIcon className="w-12 h-12 mb-3 text-slate-100" />
          <p className="text-sm font-bold text-slate-400 italic">Portofolio tidak ditemukan</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {paginated.map(p => (
            <div key={p.id} className="group bg-white rounded-2xl ring-1 ring-slate-100 overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col">
              <div className="aspect-square relative overflow-hidden bg-slate-100">
                {p.images?.[0] ? (
                  <img src={p.images[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={p.title} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-10 h-10 text-slate-300" /></div>
                )}
                <div className="absolute top-3 right-3 flex flex-col gap-2">
                  <button onClick={() => toggleFavorite(p)} className={`p-2 rounded-xl backdrop-blur-md shadow-sm border border-white/20 transition-all ${p.is_favorite ? "bg-amber-400 text-white hover:bg-amber-500" : "bg-white/50 text-slate-700 hover:bg-white/80"}`} title={p.is_favorite ? "Hapus dari favorit" : "Tandai sebagai favorit"}>
                    <Star className={`w-3.5 h-3.5 ${p.is_favorite ? "fill-white" : ""}`} />
                  </button>
                  <div className={`p-2 rounded-xl backdrop-blur-md shadow-sm border border-white/20 ${p.is_published ? "bg-emerald-500/80 text-white" : "bg-slate-500/80 text-white"}`}>
                    {p.is_published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </div>
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <button
                      onClick={(e) => {
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        setActiveCategoryId(p.id);
                        setCategoryDraft(p.category || "");
                        setDropdownPos({ top: rect.bottom + 6, left: rect.left });
                      }}
                      className="flex items-center gap-1 text-[10px] font-bold text-primary uppercase tracking-wider hover:text-secondary transition-colors group/cat"
                    >
                      {savingCategory && activeCategoryId === p.id
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <>{p.category || "Tanpa Kategori"}<ChevronDown className="w-2.5 h-2.5 opacity-40 group-hover/cat:opacity-100 transition-opacity" /></>}
                    </button>
                  </div>
                  {p.store_orders?.order_number && (
                    <span className="text-[9px] font-bold bg-indigo-50 text-primary px-1.5 py-0.5 rounded border border-indigo-100 uppercase tracking-tighter">
                      ORD-{p.store_orders.order_number.toString().padStart(4, '0')}
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-slate-900 leading-tight mb-2 line-clamp-1">{p.title}</h4>
                <p className="text-xs font-medium text-slate-400 line-clamp-2 flex-1">{p.description || "Tidak ada deskripsi."}</p>
                {p.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {p.tags.slice(0, 3).map((t: string) => (
                      <span key={t} className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">{t}</span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2 pt-4 mt-auto border-t border-slate-100">
                  <button onClick={() => openEdit(p)} className="flex-1 p-2 bg-slate-50 text-slate-500 hover:bg-indigo-50 hover:text-primary rounded-xl transition-all flex items-center justify-center">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => deletePortfolio(p.id)} className="flex-1 p-2 bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all flex items-center justify-center">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Menampilkan {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} dari {filtered.length} item
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-2 rounded-xl bg-white ring-1 ring-slate-100 shadow-sm hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 transition-all">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | "...")[]>((acc, p, i, arr) => {
                  if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) => p === "..." ? (
                  <span key={`ellipsis-${i}`} className="px-2 text-slate-400 text-sm font-bold">…</span>
                ) : (
                  <button key={p} onClick={() => setPage(p as number)}
                    className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${page === p ? "bg-primary text-white shadow-indigo-200 shadow-lg" : "bg-white ring-1 ring-slate-100 text-slate-600 hover:bg-slate-50"}`}>
                    {p}
                  </button>
                ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-2 rounded-xl bg-white ring-1 ring-slate-100 shadow-sm hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 transition-all">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </>
    )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{editingId ? "Ubah Portofolio" : "Tambah Portofolio"}</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Terbitkan karya kreatif ke portofolio</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              <ImageUploader
                label="Gambar Portofolio"
                folder="projects"
                value={formData.images[0] || ""}
                onChange={url => setFormData(f => ({ ...f, images: url ? [url] : [] }))}
              />

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Hubungkan ke Proyek (Isi otomatis)</label>
                <select 
                  value={formData.order_id || ""} 
                  onChange={e => handleProjectSelect(e.target.value)}
                  className={inputClass}
                >
                  <option value="">-- Tanpa Hubungan / Input Manual --</option>
                  {projects.map(prj => (
                    <option key={prj.id} value={prj.id}>
                      {prj.order_number} - {getProjectTitle(prj)} ({getClientName(prj)})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 font-medium mt-1.5 ml-1 italic">Memilih proyek akan mengisi otomatis bidang di bawah.</p>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Judul <span className="text-red-500">*</span></label>
                <input required type="text" value={formData.title} onChange={e => setFormData(f => ({ ...f, title: e.target.value }))}
                  placeholder="contoh: Desain Logo untuk Kopi Kenangan" className={inputClass} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Kategori</label>
                  <input type="text" list="portfolio-categories" value={formData.category} onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
                    placeholder="contoh: Desain Logo" className={inputClass} />
                  <datalist id="portfolio-categories">
                    {Array.from(new Set(portfolios.map(p => p.category).filter(Boolean))).map(cat => (
                      <option key={cat as string} value={cat as string} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Visibilitas</label>
                  <select value={formData.is_published ? "true" : "false"} onChange={e => setFormData(f => ({ ...f, is_published: e.target.value === "true" }))} className={inputClass}>
                    <option value="true">Diterbitkan</option>
                    <option value="false">Tersembunyi</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Deskripsi</label>
                <textarea value={formData.description} onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                  placeholder="Ceritakan kisah di balik proyek ini..." rows={3}
                  className={`${inputClass} resize-none`} />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Tag</label>
                <div className="flex gap-2">
                  <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                    placeholder="Tambah tag & tekan Enter" className={inputClass} />
                  <button type="button" onClick={addTag} className="px-3 py-2 bg-indigo-50 text-primary font-bold text-xs rounded-xl hover:bg-indigo-100 transition-colors shrink-0">Tambah</button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {formData.tags.map(t => (
                      <span key={t} className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 bg-indigo-50 text-primary rounded-full">
                        {t}
                        <button type="button" onClick={() => setFormData(f => ({ ...f, tags: f.tags.filter(x => x !== t) }))} className="hover:text-red-500">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors">Batal</button>
                <button type="submit" disabled={saving} className="flex-1 bg-primary hover:bg-secondary text-white py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? "Perbarui Portofolio" : "Terbitkan ke Portofolio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeCategoryId && dropdownPos && createPortal(
        <div
          ref={categoryDropdownRef}
          style={{ position: "fixed", top: dropdownPos.top, left: dropdownPos.left, zIndex: 9999 }}
          className="bg-white rounded-xl shadow-xl ring-1 ring-slate-200 w-52 overflow-hidden"
        >
          <div className="max-h-40 overflow-y-auto">
            {Array.from(new Set(portfolios.map((x: any) => x.category).filter(Boolean))).sort().map((cat) => (
              <button
                key={cat as string}
                onClick={() => updateCategory(activeCategoryId, cat as string)}
                className={`w-full text-left px-3 py-2 text-xs font-semibold transition-colors ${
                  portfolios.find((x: any) => x.id === activeCategoryId)?.category === cat
                    ? "bg-indigo-50 text-primary"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {cat as string}
              </button>
            ))}
          </div>
          <div className="border-t border-slate-100 p-2 flex gap-1">
            <input
              autoFocus
              type="text"
              value={categoryDraft}
              onChange={e => setCategoryDraft(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") { e.preventDefault(); updateCategory(activeCategoryId, categoryDraft); }
                e.stopPropagation();
              }}
              placeholder="Kategori baru..."
              className="flex-1 text-xs font-medium bg-slate-50 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-primary/20 min-w-0"
            />
            <button
              onClick={() => updateCategory(activeCategoryId, categoryDraft)}
              className="px-2 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-secondary transition-colors shrink-0"
            >OK</button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}