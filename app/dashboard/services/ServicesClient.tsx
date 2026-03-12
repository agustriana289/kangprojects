"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Pencil, Trash2, Loader2, ArrowLeft, Save, Globe, Clock, Star, Box, Check, X, Layers, MessageSquare, BriefcaseBusiness, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ToastProvider";
import ImageUploader from "@/components/admin/ImageUploader";

interface ServicePackage {
  name: string;
  price: number;
  description: string;
  features: string[];
}

interface FormField {
  label: string;
  type: string;
  options?: string[];
  required: boolean;
}

interface KeyFeature {
  title: string;
  description: string;
  icon: string;
}

interface Service {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  icon: string;
  thumbnail_url: string;
  packages: ServicePackage[];
  form_fields: FormField[];
  key_features: KeyFeature[];
  is_published: boolean;
  is_featured: boolean;
  sort_order: number;
  created_at?: string;
  portfolio_ids?: string[];
}

const emptyForm: Omit<Service, "id"> = { 
  title: "", 
  slug: "", 
  description: "", 
  category: "Desain", 
  icon: "Briefcase", 
  thumbnail_url: "", 
  packages: [{ name: "Standar", price: 0, description: "Paket Standar", features: [] }], 
  form_fields: [{ label: "Detail Proyek", type: "textarea", required: true }], 
  key_features: [],
  is_published: true, 
  is_featured: false, 
  sort_order: 0,
  portfolio_ids: [] 
};

export default function ServicesClient() {
  const supabase = createClient();
  const { showToast } = useToast();

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "form">("list");
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Omit<Service, "id">>(emptyForm);
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [portfolioSearch, setPortfolioSearch] = useState("");
  const [portfolioPage, setPortfolioPage] = useState(1);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PORTFOLIOS_PER_PAGE = 18;
  const PAGE_SIZE = 10;

  const fetchPortfolios = useCallback(async () => {
    const { data } = await supabase.from("store_portfolios").select("id, title, images").eq("is_published", true).order("created_at", { ascending: false });
    if (data) setPortfolios(data);
  }, [supabase]);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("store_services").select("*").order("sort_order", { ascending: true });
    if (error) {
      showToast("Gagal mengambil data layanan", "error");
    } else {
      setServices(data || []);
    }
    setLoading(false);
  }, [supabase, showToast]);

  useEffect(() => { fetchServices(); fetchPortfolios(); }, [fetchServices, fetchPortfolios]);

  const openNew = () => {
    setEditingService(null);
    setForm(emptyForm);
    setView("form");
  };

  const openEdit = (svc: Service) => {
    setEditingService(svc);
    setForm({ 
      title: svc.title, 
      slug: svc.slug, 
      description: svc.description, 
      category: svc.category, 
      icon: svc.icon, 
      thumbnail_url: svc.thumbnail_url || "", 
      packages: svc.packages || [], 
      form_fields: svc.form_fields || [], 
      key_features: svc.key_features || [],
      is_published: svc.is_published,  
      is_featured: svc.is_featured, 
      sort_order: svc.sort_order,
      portfolio_ids: svc.portfolio_ids || []
    });
    setView("form");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.slug) return showToast("Judul dan Slug wajib diisi", "error");
    setSaving(true);
    if (editingService) {
      const { error } = await supabase.from("store_services").update({ ...form }).eq("id", editingService.id);
      if (error) showToast("Gagal memperbarui layanan", "error");
      else { showToast("Layanan berhasil diperbarui", "success"); setView("list"); fetchServices(); }
    } else {
      const newOrder = services.length > 0 ? Math.max(...services.map((s: any) => s.sort_order || 0)) + 1 : 1;
      const { error } = await supabase.from("store_services").insert({ ...form, sort_order: newOrder });
      if (error) showToast("Gagal membuat layanan", "error");
      else { showToast("Layanan berhasil dibuat", "success"); setView("list"); fetchServices(); }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus layanan ini?")) return;
    const { error } = await supabase.from("store_services").delete().eq("id", id);
    if (error) showToast("Gagal menghapus layanan", "error");
    else { showToast("Layanan berhasil dihapus", "success"); fetchServices(); }
  };

  const togglePublished = async (svc: Service) => {
    const { error } = await supabase.from("store_services").update({ is_published: !svc.is_published }).eq("id", svc.id);
    if (error) showToast("Gagal memperbarui status", "error");
    else fetchServices();
  };

  // Form helpers
  const updatePackage = (index: number, field: keyof ServicePackage, value: string | number) => {
    const pkgs = [...form.packages];
    pkgs[index] = { ...pkgs[index], [field]: value };
    setForm({ ...form, packages: pkgs });
  };
  const addPackage = () => setForm({ ...form, packages: [...form.packages, { name: "Paket Baru", price: 0, description: "", features: [] }] });
  const removePackage = (index: number) => setForm({ ...form, packages: form.packages.filter((_, i) => i !== index) });
  
  const addFeature = (pkgIndex: number) => {
    const pkgs = [...form.packages];
    pkgs[pkgIndex].features.push("");
    setForm({ ...form, packages: pkgs });
  };
  const updateFeature = (pkgIndex: number, featIndex: number, val: string) => {
    const pkgs = [...form.packages];
    pkgs[pkgIndex].features[featIndex] = val;
    setForm({ ...form, packages: pkgs });
  };
  const removeFeature = (pkgIndex: number, featIndex: number) => {
    const pkgs = [...form.packages];
    pkgs[pkgIndex].features.splice(featIndex, 1);
    setForm({ ...form, packages: pkgs });
  };

  const addField = () => setForm({ ...form, form_fields: [...form.form_fields, { label: "Pertanyaan Baru", type: "text", required: false }] });
  const removeField = (index: number) => setForm({ ...form, form_fields: form.form_fields.filter((_, i) => i !== index) });
  const updateField = (index: number, field: keyof FormField, value: string | boolean | string[]) => {
    const fields = [...form.form_fields];
    fields[index] = { ...fields[index], [field]: value };
    setForm({ ...form, form_fields: fields });
  };

  const addKeyFeature = () => setForm({ ...form, key_features: [...(form.key_features || []), { title: "Sorotan Baru", description: "Detail tentang fitur ini", icon: "CheckCircle2" }] });
  const removeKeyFeature = (index: number) => setForm({ ...form, key_features: (form.key_features || []).filter((_, i) => i !== index) });
  const updateKeyFeature = (index: number, field: keyof KeyFeature, value: string) => {
    const kfs = [...(form.key_features || [])];
    kfs[index] = { ...kfs[index], [field]: value };
    setForm({ ...form, key_features: kfs });
  };

  const filtered = services.filter(svc => 
    svc.title.toLowerCase().includes(search.toLowerCase()) || 
    svc.category.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const inputClass = "w-full bg-white border border-slate-200 text-slate-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 p-3 transition-all outline-none";

  if (view === "form") {
    return (
      <div className="pt-6 px-4 pb-16">
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={() => setView("list")}
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Layanan
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-6 py-2.5 rounded-xl shadow-sm shadow-indigo-200 transition-colors disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {editingService ? "Perbarui Layanan" : "Simpan Layanan"}
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="lg:col-span-2 space-y-6">
              

              <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl p-6 space-y-5">
                <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3">Informasi Dasar</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Judul Layanan</label>
                    <input required value={form.title} onChange={(e: any) => {
                        const title = e.target.value;
                        const slug = title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
                        setForm(p => ({ ...p, title, slug }));
                    }} placeholder="cth. Pengembangan Website" className={`${inputClass} font-semibold`} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Slug</label>
                    <input required value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} className={`${inputClass} font-mono text-slate-500`} />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Kategori</label>
                    <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className={`${inputClass} w-full`}>
                      <option>Desain</option>
                      <option>Pengembangan</option>
                      <option>Pemasaran</option>
                      <option>Konsultasi</option>
                      <option>Lainnya</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Deskripsi</label>
                  <textarea rows={4} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Jelaskan penawaran layanan Anda..." className={`${inputClass} resize-none`} />
                </div>

                <ImageUploader 
                  label="Thumbnail Layanan" 
                  value={form.thumbnail_url} 
                  onChange={(url) => setForm(p => ({ ...p, thumbnail_url: url }))} 
                  folder="services"
                />
              </div>

              

              <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Layers className="w-5 h-5 text-primary" /> Paket Harga</h3>
                  <button type="button" onClick={addPackage} className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-200 inline-flex items-center gap-1"><Plus className="w-3 h-3"/> Tambah Paket</button>
                </div>
                
                <div className="space-y-6">
                  {form.packages.map((pkg, pIdx) => (
                    <div key={pIdx} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 relative">
                      <button type="button" onClick={() => removePackage(pIdx)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500"><Trash2 className="w-5 h-5"/></button>
                      <div className="grid grid-cols-2 gap-4 mb-4 pr-10">
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Nama Paket</label>
                          <input value={pkg.name} onChange={e => updatePackage(pIdx, 'name', e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm font-bold" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Harga (IDR)</label>
                          <input type="number" value={pkg.price} onChange={e => updatePackage(pIdx, 'price', parseInt(e.target.value) || 0)} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm font-bold text-primary" />
                        </div>
                      </div>
                      <div className="mb-4">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Deskripsi</label>
                        <input value={pkg.description} onChange={e => updatePackage(pIdx, 'description', e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm text-slate-600" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                           <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Daftar Fitur</label>
                           <button type="button" onClick={() => addFeature(pIdx)} className="text-[10px] text-primary font-bold hover:underline bg-indigo-50 px-2 py-1 rounded">Tambah Fitur</button>
                        </div>
                        <div className="space-y-2">
                           {pkg.features.map((feat, fIdx) => (
                             <div key={fIdx} className="flex items-center gap-2">
                               <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                               <input value={feat} onChange={e => updateFeature(pIdx, fIdx, e.target.value)} className="flex-1 bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-700" placeholder="contoh: Domain gratis 1 tahun" />
                               <button type="button" onClick={() => removeFeature(pIdx, fIdx)} className="text-slate-400 hover:text-red-500"><X className="w-4 h-4"/></button>
                             </div>
                           ))}
                           {pkg.features.length === 0 && <div className="text-xs text-slate-400 italic">Belum ada fitur ditambahkan.</div>}
                        </div>
                      </div>
                    </div>
                  ))}
                  {form.packages.length === 0 && <div className="text-center py-6 text-slate-400 text-sm">Tidak ada paket harga. Klik &apos;Tambah Paket&apos; untuk membuatnya.</div>}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              

              <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl p-6">
                 <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3">Status</h3>
                 <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div>
                        <p className="text-sm font-bold text-slate-900 flex items-center gap-2">{form.is_published ? <Globe className="w-4 h-4 text-emerald-500" /> : <Clock className="w-4 h-4 text-slate-400" />} {form.is_published ? "Diterbitkan" : "Draf"}</p>
                        <p className="text-xs text-slate-400">Visibilitas di situs</p>
                      </div>
                      <button type="button" onClick={() => setForm((p: any) => ({ ...p, is_published: !p.is_published }))} className={`w-11 h-6 rounded-full relative transition-all ${form.is_published ? "bg-emerald-500" : "bg-slate-300"}`}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${form.is_published ? "right-1" : "left-1"}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div>
                        <p className="text-sm font-bold text-slate-900 flex items-center gap-2"><Star className={`w-4 h-4 ${form.is_featured ? 'text-yellow-500 fill-yellow-500' : 'text-slate-400'}`} /> Unggulan</p>
                        <p className="text-xs text-slate-400">Tampilkan di halaman utama</p>
                      </div>
                      <button type="button" onClick={() => setForm((p: any) => ({ ...p, is_featured: !p.is_featured }))} className={`w-11 h-6 rounded-full relative transition-all ${form.is_featured ? "bg-yellow-500" : "bg-slate-300"}`}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${form.is_featured ? "right-1" : "left-1"}`} />
                      </button>
                    </div>
                 </div>
              </div>

              

              <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-primary" /> Persyaratan Klien</h3>
                  <button type="button" onClick={addField} className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded hover:bg-slate-200">+ Tambah</button>
                </div>
                
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                   {form.form_fields.map((f: any, i: number) => (
                     <div key={i} className="bg-slate-50 p-3 rounded-xl border border-slate-200 relative">
                        <button type="button" onClick={() => removeField(i)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500"><X className="w-3 h-3"/></button>
                        <div className="space-y-3 pr-6">
                           <div>
                              <label className="text-[9px] font-bold uppercase text-slate-500">Pertanyaan</label>
                              <input value={f.label} onChange={(e: any) => updateField(i, 'label', e.target.value)} className="w-full bg-white border border-slate-200 p-1.5 rounded text-xs font-semibold" />
                           </div>
                           <div className="flex gap-2">
                              <div className="flex-1">
                                 <label className="text-[9px] font-bold uppercase text-slate-500">Tipe</label>
                                 <select value={f.type} onChange={e => updateField(i, 'type', e.target.value)} className="w-full bg-white border border-slate-200 p-1.5 rounded text-xs">
                                    <option value="text">Teks Biasa</option>
                                    <option value="textarea">Paragraf</option>
                                    <option value="select">Pilihan</option>
                                    <option value="file">Unggah Berkas</option>
                                 </select>
                              </div>
                              <div className="w-16 flex flex-col items-center">
                                 <label className="text-[9px] font-bold uppercase text-slate-500 pb-1">Wajib</label>
                                 <input type="checkbox" checked={f.required} onChange={e => updateField(i, 'required', e.target.checked)} className="rounded border-slate-300 text-primary" />
                              </div>
                           </div>
                           {f.type === "select" && (
                              <div>
                                 <label className="text-[9px] font-bold uppercase text-slate-500">Opsi (dipisahkan koma)</label>
                                 <input value={f.options?.join(",") || ""} onChange={e => updateField(i, 'options', e.target.value.split(",").map(s => s.trim()))} className="w-full bg-white border border-slate-200 p-1.5 rounded text-xs" placeholder="Opsi 1, Opsi 2" />
                              </div>
                           )}
                        </div>
                     </div>
                   ))}
                   {form.form_fields.length === 0 && <div className="text-xs text-slate-400 text-center py-4">Tidak ada bidang formulir pesanan yang ditentukan.</div>}
                </div>
              </div>

              

              <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl p-6 mt-6">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><Star className="w-4 h-4 text-primary fill-indigo-500" /> Sorotan Layanan</h3>
                  <button type="button" onClick={addKeyFeature} className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded hover:bg-slate-200">+ Tambah</button>
                </div>
                
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                   {(form.key_features || []).map((kf: any, i: number) => (
                     <div key={i} className="bg-slate-50 p-3 rounded-xl border border-slate-200 relative mt-3">
                        <button type="button" onClick={() => removeKeyFeature(i)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500"><X className="w-3 h-3"/></button>
                        <div className="space-y-3 pr-6">
                           <div className="grid grid-cols-3 gap-2">
                             <div className="col-span-2">
                                <label className="text-[9px] font-bold uppercase text-slate-500">Judul Sorotan</label>
                                <input value={kf.title} onChange={(e: any) => updateKeyFeature(i, 'title', e.target.value)} className="w-full bg-white border border-slate-200 p-1.5 rounded text-xs font-semibold" placeholder="contoh: Kualitas Terjamin" />
                             </div>
                             <div>
                                <label className="text-[9px] font-bold uppercase text-slate-500">Nama Ikon</label>
                                <input value={kf.icon} onChange={(e: any) => updateKeyFeature(i, 'icon', e.target.value)} className="w-full bg-white border border-slate-200 p-1.5 rounded text-xs" placeholder="CheckCircle2" />
                             </div>
                           </div>
                           <div>
                              <label className="text-[9px] font-bold uppercase text-slate-500">Deskripsi</label>
                              <textarea rows={2} value={kf.description} onChange={(e: any) => updateKeyFeature(i, 'description', e.target.value)} className="w-full bg-white border border-slate-200 p-1.5 rounded text-xs resize-none" placeholder="Detail singkat..." />
                           </div>
                        </div>
                     </div>
                   ))}
                   {(!form.key_features || form.key_features.length === 0) && <div className="text-xs text-slate-400 text-center py-4">Belum ada sorotan ditambahkan. Ini akan muncul di bawah deskripsi.</div>}
                </div>
              </div>

              <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl p-6 mt-6">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><BriefcaseBusiness className="w-4 h-4 text-primary" /> Portofolio Terhubung</h3>
                  <button type="button" onClick={() => setShowPortfolioModal(true)} className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded hover:bg-slate-200">+ Tambah Portofolio</button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 max-h-[400px] overflow-y-auto">
                  {(form.portfolio_ids || []).map((pid: any) => {
                    const port = portfolios.find((p: any) => p.id === pid);
                    if (!port) return null;
                    const portImage = Array.isArray(port.images) && port.images.length > 0 ? port.images[0] : (typeof port.images === 'string' && port.images ? port.images : "");
                    
                    return (
                      <div key={pid} className="relative group rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                        {portImage ? (
                          <img src={portImage} alt={port.title || "Portfolio"} className="w-full h-24 object-cover bg-slate-100" />
                        ) : (
                          <div className="w-full h-24 bg-slate-100 flex items-center justify-center text-slate-300">
                            <BriefcaseBusiness className="w-6 h-6 opacity-20" />
                          </div>
                        )}
                        <div className="p-2 bg-white border-t border-slate-100">
                          <p className="text-xs font-bold truncate text-slate-800">{port.title || "Tanpa Judul"}</p>
                        </div>
                        <button type="button" onClick={() => setForm((p: any) => ({ ...p, portfolio_ids: (p.portfolio_ids || []).filter((id: any) => id !== pid) }))} className="absolute top-1 right-1 bg-white/90 backdrop-blur rounded p-1 text-slate-500 hover:text-red-500 hover:bg-white shadow">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )
                  })}
                  {(!form.portfolio_ids || form.portfolio_ids.length === 0) && (
                    <div className="col-span-2 text-xs text-slate-400 text-center py-4">Tidak ada portofolio yang terhubung.</div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </form>

        {showPortfolioModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-900">Pilih Portofolio (Maks 9)</h3>
                <button onClick={() => setShowPortfolioModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
              </div>

              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    type="text"
                    value={portfolioSearch}
                    onChange={(e) => {
                      setPortfolioSearch(e.target.value);
                      setPortfolioPage(1); // Reset page on search
                    }}
                    placeholder="Cari portofolio..."
                    className="w-full bg-white border border-slate-200 pl-9 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="p-4 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 flex-1">
                {(() => {
                  const filteredPortfolios = portfolios.filter((p: any) => !portfolioSearch || p.title?.toLowerCase().includes(portfolioSearch.toLowerCase()));
                  const totalPages = Math.ceil(filteredPortfolios.length / PORTFOLIOS_PER_PAGE);
                  const pagedPortfolios = filteredPortfolios.slice((portfolioPage - 1) * PORTFOLIOS_PER_PAGE, portfolioPage * PORTFOLIOS_PER_PAGE);

                  if (filteredPortfolios.length === 0) {
                    return (
                      <div className="col-span-full text-center py-12 text-slate-400">
                        <BriefcaseBusiness className="w-8 h-8 mx-auto mb-3 opacity-20" />
                        <p>Tidak ada portofolio ditemukan.</p>
                      </div>
                    );
                  }

                  return (
                    <>
                      {pagedPortfolios.map((port: any) => {
                        const isSelected = (form.portfolio_ids || []).includes(port.id);
                        
                        return (
                          <div 
                            key={port.id} 
                            onClick={() => {
                              const current = form.portfolio_ids || [];
                              if (isSelected) {
                                setForm((p: any) => ({ ...p, portfolio_ids: current.filter((id: any) => id !== port.id) }));
                              } else if (current.length < 9) {
                                setForm((p: any) => ({ ...p, portfolio_ids: [...current, port.id] }));
                              }
                            }}
                            className={`cursor-pointer border rounded-lg overflow-hidden transition-all flex items-center p-3 ${
                              isSelected 
                                ? 'border-primary bg-primary/5 shadow-sm' 
                                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex-1 min-w-0 pr-2">
                              <p className="text-sm font-semibold truncate text-slate-800">{port.title || "Tanpa Judul Portofolio"}</p>
                            </div>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${isSelected ? 'bg-primary border-primary' : 'bg-white border-slate-300'}`}>
                              {isSelected && <Check className="w-3 h-3 text-white" />}
                            </div>
                          </div>
                        );
                      })}
                    </>
                  );
                })()}
              </div>

              {/* Pagination controls & Footer */}
              <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50 rounded-b-2xl">
                {(() => {
                  const filteredLength = portfolios.filter((p: any) => !portfolioSearch || p.title?.toLowerCase().includes(portfolioSearch.toLowerCase())).length;
                  const totalPages = Math.max(1, Math.ceil(filteredLength / PORTFOLIOS_PER_PAGE));
                  
                  return (
                    <div className="flex items-center gap-4 w-full sm:w-auto overflow-x-auto">
                      <div className="text-xs text-slate-500 whitespace-nowrap">
                        Menampilkan {Math.min(filteredLength, (portfolioPage - 1) * PORTFOLIOS_PER_PAGE + 1)} - {Math.min(filteredLength, portfolioPage * PORTFOLIOS_PER_PAGE)} dari {filteredLength}
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => setPortfolioPage(p => Math.max(1, p - 1))}
                          disabled={portfolioPage === 1}
                          className="p-1 rounded text-slate-500 hover:bg-slate-200 disabled:opacity-50 disabled:hover:bg-transparent"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-medium px-2 py-1 bg-white border border-slate-200 rounded min-w-[32px] text-center">
                          {portfolioPage} / {totalPages}
                        </span>
                        <button 
                          onClick={() => setPortfolioPage(p => Math.min(totalPages, p + 1))}
                          disabled={portfolioPage >= totalPages}
                          className="p-1 rounded text-slate-500 hover:bg-slate-200 disabled:opacity-50 disabled:hover:bg-transparent"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })()}

                <button onClick={() => setShowPortfolioModal(false)} className="w-full sm:w-auto bg-primary text-white text-sm font-bold px-6 py-2 rounded-lg hover:bg-primary/90 shadow-sm">
                  Simpan Pilihan ({(form.portfolio_ids || []).length}/9)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="pt-6 px-4 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Direktori Layanan</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Kelola penawaran dan paket layanan profesional.</p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-sm shadow-indigo-200 transition-colors w-fit"
        >
          <Plus className="w-4 h-4" /> Layanan Baru
        </button>
      </div>
      
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Cari layanan berdasarkan judul atau kategori..."
          className="w-full bg-white shadow-sm ring-1 ring-slate-100 border-0 rounded-2xl pl-9 pr-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20" />
      </div>

      <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-400">
            <Box className="w-10 h-10 mb-3 text-slate-200" />
            <p className="text-sm font-bold">Tidak ada layanan yang ditentukan</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-100 bg-slate-50/50">
                    <th className="px-6 py-4">Info Layanan</th>
                    <th className="px-6 py-4">Harga</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginated.map(svc => (
                    <tr key={svc.id} className="hover:bg-slate-50/60 transition-colors group">
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                              {svc.thumbnail_url ? (
                                <img src={svc.thumbnail_url} alt={svc.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-12 flex items-center justify-center text-slate-400">
                                  <Globe className="w-5 h-5" />
                                </div>
                              )}
                            </div>
                            <div>
                               <p className="text-sm font-bold text-slate-900 line-clamp-1">{svc.title}</p>
                               <div className="flex items-center gap-2 mt-1">
                                 <span className="text-[10px] font-bold text-primary bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-wider border border-indigo-100">{svc.category}</span>
                                 {svc.is_featured && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded uppercase tracking-wider border border-amber-100 flex items-center gap-1"><Star className="w-3 h-3 fill-amber-500" /> Unggulan</span>}
                               </div>
                            </div>
                         </div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex -space-x-1.5">
                           {svc.packages?.map((p, i) => (
                             <div key={i} className="w-7 h-7 rounded-full border-2 border-white bg-indigo-50 flex items-center justify-center text-[9px] font-bold text-primary shadow-sm" title={p.name}>
                               {p.name.charAt(0).toUpperCase()}
                             </div>
                           ))}
                         </div>
                         <p className="text-xs text-slate-400 mt-1.5">{svc.packages?.length || 0} Paket harga</p>
                      </td>
                      <td className="px-6 py-4">
                         <button onClick={() => togglePublished(svc)} className="flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded-lg hover:bg-slate-100 transition-colors">
                           {svc.is_published 
                             ? <><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div> <span className="text-emerald-700">Diterbitkan</span></>
                             : <><div className="w-2 h-2 rounded-full bg-slate-300"></div> <span className="text-slate-500">Draf</span></>}
                         </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEdit(svc)} className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-primary transition-colors" title="Ubah">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(svc.id)} className="p-2 rounded-lg bg-slate-100 text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-colors" title="Hapus">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-100">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                  Menampilkan {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} dari {filtered.length} layanan
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 transition-all">
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
                        className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${page === p ? "bg-indigo-600 text-white shadow-indigo-200 shadow-md" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                        {p}
                      </button>
                    ))}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 transition-all">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}