"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Loader2, ArrowLeft, Save, Globe, Clock, Box, Check, X, Layers, MessageSquare, Image as ImageIcon, Star, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ToastProvider";
import ImageUploader from "@/components/admin/ImageUploader";

interface ProductPackage {
  name: string;
  price: number;
  desc: string;
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

interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  images: string[];
  packages: ProductPackage[];
  form_fields: FormField[];
  key_features: KeyFeature[];
  is_published: boolean;
  created_at?: string;
}

const emptyForm: Omit<Product, "id"> = { 
  title: "", 
  slug: "", 
  description: "", 
  category: "Logo",
  images: [],  
  packages: [{ name: "Standar", price: 100000, desc: "Untuk proyek pribadi atau usaha kecil.", features: ["Desain logo original", "File PNG & JPG resolusi tinggi", "Lisensi standar untuk penggunaan pribadi atau usaha kecil"] },{ name: "Extended", price: 250000, desc: "Penggunaan komersial tak terbatas, termasuk penjualan dan distribusi.", features: ["Desain logo original", "File lengkap (AI, SVG, PNG, PDF)", "Lisensi komersial tanpa batas untuk penjualan dan distribusi"] }], 
  form_fields: [{ label: "Nama Brand", type: "text", required: true }, { label: "Bidang Usaha", type: "text", required: true }, { label: "Konsep / Deskripsi Logo", type: "textarea",required: false }], 
  key_features: [
    { title: "Hak Cipta Penuh", description: "Seluruh hak desain sepenuhnya menjadi milik Anda setelah proyek selesai.", icon: "Copyright" },
    { title: "Desain 100% Original", description: "Dibuat dari nol oleh desainer, bukan template atau generator otomatis.", icon: "Paintbrush" },
    { title: "Gratis Revisi", description: "Minta penyesuaian desain tanpa biaya tambahan hingga sesuai kebutuhan.", icon: "Pencil" },
    { title: "Desain Eksklusif", description: "Logo hanya digunakan oleh Anda dan dapat didaftarkan sebagai merek dagang.", icon: "Crown" }
  ],
  is_published: false
};

export default function ShopClient() {
  const supabase = createClient();
  const { showToast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "form">("list");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Omit<Product, "id">>(emptyForm);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("store_products").select("*").order("created_at", { ascending: false });
    if (error) {
      showToast("Gagal mengambil produk", "error");
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  }, [supabase, showToast]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const openNew = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setView("form");
  };

  const openEdit = (prd: Product) => {
    setEditingProduct(prd);
    setForm({ 
      title: prd.title, 
      slug: prd.slug, 
      description: prd.description, 
      category: prd.category, 
      images: prd.images || [], 
      packages: prd.packages || [], 
      form_fields: prd.form_fields || [], 
      key_features: prd.key_features || [],
      is_published: prd.is_published 
    });
    setView("form");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.slug) return showToast("Judul dan Slug wajib diisi", "error");
    setSaving(true);
    
    const payload: any = { ...form };
    payload.images = payload.images.filter(Boolean);
    if (payload.images.length === 0) {
      delete payload.images; 
    }
    
    if (editingProduct) {
      const { error } = await supabase.from("store_products").update(payload).eq("id", editingProduct.id);
      if (error) showToast(error.message || "Gagal memperbarui produk", "error");
      else { showToast("Produk diperbarui", "success"); setView("list"); fetchProducts(); }
    } else {
      const { error } = await supabase.from("store_products").insert(payload);
      if (error) showToast(error.message || "Gagal membuat produk", "error");
      else { showToast("Produk dibuat", "success"); setView("list"); fetchProducts(); }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus produk ini?")) return;
    const { error } = await supabase.from("store_products").delete().eq("id", id);
    if (error) showToast("Gagal menghapus produk", "error");
    else { showToast("Produk dihapus", "success"); fetchProducts(); }
  };

  const togglePublished = async (prd: Product) => {
    const { error } = await supabase.from("store_products").update({ is_published: !prd.is_published }).eq("id", prd.id);
    if (error) showToast("Gagal memperbarui status", "error");
    else fetchProducts();
  };

  const updatePackage = (index: number, field: keyof ProductPackage, value: string | number) => {
    const pkgs = [...form.packages];
    pkgs[index] = { ...pkgs[index], [field]: value };
    setForm({ ...form, packages: pkgs });
  };
  const addPackage = () => setForm({ ...form, packages: [...form.packages, { name: "Lisensi Baru", price: 0, desc: "", features: [] }] });
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

  const addField = () => setForm(prev => ({ ...prev, form_fields: [...prev.form_fields, { label: "Kolom Baru", type: "text", required: false }] }));
  const removeField = (index: number) => setForm(prev => ({ ...prev, form_fields: prev.form_fields.filter((_, i) => i !== index) }));
  const updateField = (index: number, field: keyof FormField, value: string | boolean | string[]) => {
    setForm(prev => {
      const fields = [...prev.form_fields];
      fields[index] = { ...fields[index], [field]: value };
      return { ...prev, form_fields: fields };
    });
  };

  const addKeyFeature = () => setForm(prev => ({ ...prev, key_features: [...(prev.key_features || []), { title: "Sorotan Baru", description: "Detail tentang fitur ini", icon: "Download" }] }));
  const removeKeyFeature = (index: number) => setForm(prev => ({ ...prev, key_features: (prev.key_features || []).filter((_, i) => i !== index) }));
  const updateKeyFeature = (index: number, field: keyof KeyFeature, value: string) => {
    setForm(prev => {
      const kfs = [...(prev.key_features || [])];
      kfs[index] = { ...kfs[index], [field]: value };
      return { ...prev, key_features: kfs };
    });
  };

  const filtered = products.filter(prd => 
    prd.title.toLowerCase().includes(search.toLowerCase()) || 
    prd.category.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const inputClass = "w-full bg-white border border-slate-200 text-slate-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-secondary p-3 transition-all outline-none";

  if (view === "form") {
    return (
      <div className="pt-6 px-4 pb-16 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={() => setView("list")}
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Produk
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-primary hover:bg-secondary text-white text-sm font-bold px-6 py-2.5 rounded-xl shadow-sm shadow-indigo-200 transition-colors disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {editingProduct ? "Perbarui Produk" : "Simpan Produk"}
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="lg:col-span-2 space-y-6">
              

              <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl p-6 space-y-5">
                <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3">Informasi Dasar</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Judul Produk</label>
                    <input required value={form.title} onChange={e => {
                        const title = e.target.value;
                        const slug = title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
                        setForm(p => ({ ...p, title, slug }));
                    }} placeholder="contoh: Kit UI Modern" className={`${inputClass} font-semibold`} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Slug</label>
                    <input required value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} className={`${inputClass} font-mono text-slate-500`} />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Deskripsi</label>
                  <textarea rows={4} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Deskripsikan produk digital Anda..." className={`${inputClass} resize-none`} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <ImageUploader
                      label="Gambar Utama"
                      folder="products"
                      value={form.images[0] || ""}
                      onChange={url => setForm(p => ({ ...p, images: url ? [url] : [] }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Kategori</label>
                    <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className={inputClass}>
                      <option>Logo</option>
                      <option>Icon</option>
                      <option>Template</option>
                      <option>Banner</option>
                      <option>Vector</option>
                      <option>Graphic Pack</option>
                    </select>
                  </div>
                </div>
              </div>

              

              <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Layers className="w-5 h-5 text-primary" /> Lisensi & Harga</h3>
                  <button type="button" onClick={addPackage} className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-200 inline-flex items-center gap-1"><Plus className="w-3 h-3"/> Tambah Lisensi</button>
                </div>
                
                <div className="space-y-6">
                  {form.packages.map((pkg, pIdx) => (
                    <div key={pIdx} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 relative">
                      <button type="button" onClick={() => removePackage(pIdx)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500"><Trash2 className="w-5 h-5"/></button>
                      <div className="grid grid-cols-2 gap-4 mb-4 pr-10">
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Nama Lisensi</label>
                          <input value={pkg.name} onChange={e => updatePackage(pIdx, 'name', e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm font-bold" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Harga (IDR)</label>
                          <input type="number" value={pkg.price} onChange={e => updatePackage(pIdx, 'price', parseInt(e.target.value) || 0)} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm font-bold text-primary" />
                        </div>
                      </div>
                      <div className="mb-4">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Deskripsi</label>
                        <input value={pkg.desc} onChange={e => updatePackage(pIdx, 'desc', e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm text-slate-600" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                           <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Aspek yang Disertakan</label>
                           <button type="button" onClick={() => addFeature(pIdx)} className="text-[10px] text-primary font-bold hover:underline bg-indigo-50 px-2 py-1 rounded">Tambah Baris</button>
                        </div>
                        <div className="space-y-2">
                           {pkg.features.map((feat, fIdx) => (
                             <div key={fIdx} className="flex items-center gap-2">
                               <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                               <input value={feat} onChange={e => updateFeature(pIdx, fIdx, e.target.value)} className="flex-1 bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-700" placeholder="contoh: Termasuk 1 proyek" />
                               <button type="button" onClick={() => removeFeature(pIdx, fIdx)} className="text-slate-400 hover:text-red-500"><X className="w-4 h-4"/></button>
                             </div>
                           ))}
                           {pkg.features.length === 0 && <div className="text-xs text-slate-400 italic">Belum ada fitur yang ditentukan.</div>}
                        </div>
                      </div>
                    </div>
                  ))}
                  {form.packages.length === 0 && <div className="text-center py-6 text-slate-400 text-sm">Belum ada pengaturan harga. Klik &apos;Tambah Lisensi&apos; untuk membuat satu.</div>}
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
                      <button type="button" onClick={() => setForm(p => ({ ...p, is_published: !p.is_published }))} className={`w-11 h-6 rounded-full relative transition-all ${form.is_published ? "bg-emerald-500" : "bg-slate-300"}`}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${form.is_published ? "right-1" : "left-1"}`} />
                      </button>
                    </div>
                 </div>
              </div>

              

              <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl p-6 mt-6">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><Star className="w-4 h-4 text-primary fill-primary" /> Sorotan Produk</h3>
                  <button type="button" onClick={addKeyFeature} className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded hover:bg-slate-200">+ Tambah</button>
                </div>
                
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                   {(form.key_features || []).map((kf, i) => (
                     <div key={i} className="bg-slate-50 p-3 rounded-xl border border-slate-200 relative mt-3">
                        <button type="button" onClick={() => removeKeyFeature(i)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500"><X className="w-3 h-3"/></button>
                        <div className="space-y-3 pr-6">
                           <div className="grid grid-cols-3 gap-2">
                             <div className="col-span-2">
                                <label className="text-[9px] font-bold uppercase text-slate-500">Judul Sorotan</label>
                                <input value={kf.title} onChange={e => updateKeyFeature(i, 'title', e.target.value)} className="w-full bg-white border border-slate-200 p-1.5 rounded text-xs font-semibold" placeholder="misal: Pengiriman Instan" />
                             </div>
                             <div>
                                <label className="text-[9px] font-bold uppercase text-slate-500">Nama Ikon</label>
                                <input value={kf.icon} onChange={e => updateKeyFeature(i, 'icon', e.target.value)} className="w-full bg-white border border-slate-200 p-1.5 rounded text-xs" placeholder="Download" />
                             </div>
                           </div>
                           <div>
                              <label className="text-[9px] font-bold uppercase text-slate-500">Deskripsi</label>
                              <textarea rows={2} value={kf.description} onChange={e => updateKeyFeature(i, 'description', e.target.value)} className="w-full bg-white border border-slate-200 p-1.5 rounded text-xs resize-none" placeholder="Detail singkat..." />
                           </div>
                        </div>
                     </div>
                   ))}
                   {(!form.key_features || form.key_features.length === 0) && <div className="text-xs text-slate-400 text-center py-4">Belum ada sorotan yang ditambahkan. Ini akan muncul di bawah deskripsi.</div>}
                </div>
              </div>

              

              <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-primary" /> Data Wajib Checkout</h3>
                  </div>
                  <button type="button" onClick={addField} className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded hover:bg-slate-200">+ Tambah</button>
                </div>
                
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                   {form.form_fields.map((f, i) => (
                     <div key={i} className="bg-slate-50 p-3 rounded-xl border border-slate-200 relative">
                        <button type="button" onClick={() => removeField(i)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500"><X className="w-3 h-3"/></button>
                        <div className="space-y-3 pr-6">
                           <div>
                              <label className="text-[9px] font-bold uppercase text-slate-500">Label Kolom</label>
                              <input value={f.label} onChange={e => updateField(i, 'label', e.target.value)} className="w-full bg-white border border-slate-200 p-1.5 rounded text-xs font-semibold" />
                           </div>
                           <div className="flex gap-2">
                              <div className="flex-1">
                                 <label className="text-[9px] font-bold uppercase text-slate-500">Tipe</label>
                                 <select value={f.type} onChange={e => updateField(i, 'type', e.target.value)} className="w-full bg-white border border-slate-200 p-1.5 rounded text-xs">
                                    <option value="text">Teks Biasa</option>
                                    <option value="textarea">Paragraf</option>
                                    <option value="select">Dropdown</option>
                                    <option value="file">Unggah File</option>
                                 </select>
                              </div>
                              <div className="w-16 flex flex-col items-center">
                                 <label className="text-[9px] font-bold uppercase text-slate-500 pb-1">Wajib</label>
                                 <input type="checkbox" checked={f.required} onChange={e => updateField(i, 'required', e.target.checked)} className="rounded border-slate-300 text-primary" />
                              </div>
                           </div>
                           {f.type === "select" && (
                              <div>
                                 <label className="text-[9px] font-bold uppercase text-slate-500">Pilihan (Pisahkan dengan koma)</label>
                                 <input value={f.options?.join(",") || ""} onChange={e => updateField(i, 'options', e.target.value.split(",").map(s => s.trim()))} className="w-full bg-white border border-slate-200 p-1.5 rounded text-xs" placeholder="Pilihan 1, Pilihan 2" />
                              </div>
                           )}
                        </div>
                     </div>
                   ))}
                   {form.form_fields.length === 0 && <div className="text-xs text-slate-400 text-center py-4">Opsional, tambahkan data yang wajib diberikan pengguna saat checkout.</div>}
                </div>
              </div>

            </div>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="pt-6 px-4 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Direktori Toko</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Kelola produk digital dan item yang tersedia untuk dibeli.</p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 bg-primary hover:bg-secondary text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-sm shadow-indigo-200 transition-colors w-fit"
        >
          <Plus className="w-4 h-4" /> Produk Baru
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Cari produk berdasarkan judul atau kategori..."
          className="w-full bg-white shadow-sm ring-1 ring-slate-100 border-0 rounded-2xl pl-9 pr-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20" />
      </div>

      <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-400">
            <Box className="w-10 h-10 mb-3 text-slate-200" />
            <p className="text-sm font-bold">Produk tidak ditemukan</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-4">Detail Produk</th>
                  <th className="px-6 py-4">Lisensi / Paket</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginated.map(prd => (
                  <tr key={prd.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                             {prd.images?.[0] ? <img src={prd.images[0]} className="w-full h-full object-cover" alt={prd.title}/> : <ImageIcon className="w-5 h-5 text-slate-400" />}
                          </div>
                          <div>
                             <p className="font-bold text-slate-900">{prd.title}</p>
                             <div className="flex gap-2 items-center mt-1">
                               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{prd.category}</span>
                             </div>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex -space-x-1.5">
                         {prd.packages?.map((p, i) => (
                           <div key={i} className="w-7 h-7 rounded-full border-2 border-white bg-indigo-50 flex items-center justify-center text-[9px] font-bold text-primary shadow-sm" title={p.name}>
                             {p.name.charAt(0).toUpperCase()}
                           </div>
                         ))}
                       </div>
                       <p className="text-xs text-slate-400 mt-1.5">{prd.packages?.length || 0} Paket harga</p>
                    </td>
                    <td className="px-6 py-4">
                       <button onClick={() => togglePublished(prd)} className="flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded-lg hover:bg-slate-100 transition-colors">
                         {prd.is_published 
                           ? <><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div> <span className="text-emerald-700">Diterbitkan</span></>
                           : <><div className="w-2 h-2 rounded-full bg-slate-300"></div> <span className="text-slate-500">Draf</span></>}
                       </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(prd)} className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-primary transition-colors" title="Ubah">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(prd.id)} className="p-2 rounded-lg bg-slate-100 text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-colors" title="Hapus">
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
                Menampilkan {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} dari {filtered.length} produk
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
                      className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${page === p ? "bg-primary text-white shadow-indigo-200 shadow-md" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
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