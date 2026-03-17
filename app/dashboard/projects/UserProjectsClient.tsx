"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search, Package, Briefcase, Loader2, RefreshCcw,
  MessageSquare, Eye, X, CreditCard, Upload, Download,
  AlertCircle, FileCheck, ShieldCheck, Hash, Calendar, Wallet
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ToastProvider";
import Link from "next/link";

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  product_id?: string;
  service_id?: string;
  payment_proof?: string;
  delivery_file?: string;
  selected_package?: any;
  form_data?: any;
  store_products?: { title: string };
  store_services?: { title: string };
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  waiting_payment: "bg-yellow-50 text-yellow-700 border-yellow-200",
  paid: "bg-indigo-50 text-primary border-indigo-200",
  processing: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  revision: "bg-orange-50 text-orange-700 border-orange-200",
};

export const metadata = { title: "Proyek" };
export default function UserProjectsClient({ userId }: { userId: string }) {
  const supabase = createClient();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [selected, setSelected] = useState<Order | null>(null);
  const [paymentProofUrl, setPaymentProofUrl] = useState("");
  const [uploadingProof, setUploadingProof] = useState(false);
  const [savingProof, setSavingProof] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("store_orders")
      .select("*, store_products(title), store_services(title)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) showToast(error.message, "error");
    else setOrders((data as Order[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const openDetail = (o: Order) => {
    setSelected(o);
    setPaymentProofUrl(o.payment_proof || "");
  };

  const closeDetail = () => { setSelected(null); setPaymentProofUrl(""); };

  const handleUploadProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selected) return;
    if (!file.type.startsWith("image/")) return showToast("Unggah file gambar untuk bukti pembayaran.", "error");
    setUploadingProof(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `payment-proofs/proof-${selected.id}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("assets").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("assets").getPublicUrl(path);
      setPaymentProofUrl(publicUrl);
      showToast("Bukti berhasil diunggah!", "success");
    } catch (err: any) {
      showToast(err.message || "Gagal mengunggah.", "error");
    } finally {
      setUploadingProof(false);
    }
  };

  const handleSubmitProof = async () => {
    if (!paymentProofUrl || !selected) return;
    setSavingProof(true);
    const { error } = await supabase.from("store_orders").update({
      payment_proof: paymentProofUrl,
      status: "waiting_payment",
    }).eq("id", selected.id);
    if (error) showToast(error.message, "error");
    else {
      showToast("Bukti pembayaran telah dikirim! Menunggu konfirmasi admin.", "success");
      setSelected(prev => prev ? { ...prev, status: "waiting_payment", payment_proof: paymentProofUrl } : null);
      fetchOrders();
    }
    setSavingProof(false);
  };

  const filtered = orders.filter(o => {
    const title = o.store_products?.title || o.store_services?.title || "";
    return o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      title.toLowerCase().includes(search.toLowerCase());
  });

  const getFormData = (o: Order) => {
    try { return typeof o.form_data === "string" ? JSON.parse(o.form_data) : (o.form_data || {}); }
    catch { return {}; }
  };

  const getProjectTitle = (o: Order) => {
    const fd = getFormData(o) || {};
    const projectNote = fd["project_title"] || fd["Project Title"] || fd["Nama Logo"] || fd["nama_logo"] || "";
    if (projectNote) return projectNote;

    const baseTitle = o.store_products?.title || o.store_services?.title || "";
    let pkgName = "";
    try {
      if (typeof o.selected_package === "string") {
        try { pkgName = JSON.parse(o.selected_package)?.name || ""; } catch { pkgName = o.selected_package; }
      } else {
        pkgName = o.selected_package?.name || "";
      }
    } catch { /* ignore */ }
    
    if (baseTitle && pkgName) return `${baseTitle} (${pkgName})`;
    if (baseTitle) return baseTitle;
    return pkgName || "Proyek";
  };

  const getPkgName = (o: Order) => {
    try {
      const pkg = typeof o.selected_package === "string" ? JSON.parse(o.selected_package) : o.selected_package;
      return pkg?.name || "";
    } catch { return ""; }
  };

  return (
    <div className="pt-6 px-4 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Proyek Saya</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Pantau komisi aktif dan pengiriman layanan Anda.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchOrders}
            className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold px-4 py-2.5 rounded-xl shadow-sm hover:bg-slate-50 transition-colors">
            <RefreshCcw className="w-4 h-4" /> Segarkan
          </button>
          <Link href="/services"
            className="inline-flex items-center gap-2 bg-primary hover:bg-secondary text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-sm shadow-indigo-200 transition-colors">
            Telusuri Layanan
          </Link>
        </div>
      </div>

      <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Cari berdasarkan ID pesanan atau judul..."
              className="w-full bg-slate-50 border-0 rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Briefcase className="w-10 h-10 mb-3 text-slate-200" />
            <p className="text-sm font-bold">Belum ada proyek</p>
            <p className="text-xs mt-1">Pesan dari Layanan atau Toko kami untuk memulai</p>
            <Link href="/services" className="mt-4 text-xs font-bold text-primary hover:underline">Telusuri Layanan →</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-4">Ref Pesanan</th>
                  <th className="px-6 py-4">Proyek</th>
                  <th className="px-6 py-4">Jumlah</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Tanggal</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(o => (
                  <tr key={o.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-700">#{o.order_number}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center shrink-0 text-slate-400">
                          {o.service_id ? <Briefcase className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                        </div>
                        <p className="text-sm font-bold text-slate-900">{getProjectTitle(o)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-900">Rp {Number(o.total_amount || 0).toLocaleString("id-ID")}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${STATUS_COLORS[o.status] || "bg-slate-50 text-slate-500 border-slate-200"}`}>
                        {o.status.replace(/_/g, " ").replace("pending", "menunggu").replace("waiting payment", "menunggu pembayaran").replace("paid", "dibayar").replace("processing", "diproses").replace("completed", "selesai").replace("cancelled", "dibatalkan").replace("revision", "revisi")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium text-slate-400">
                        {new Date(o.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => openDetail(o)}
                          className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-primary transition-colors" title="Lihat Detail">
                          <Eye className="w-4 h-4" />
                        </button>
                        <Link href={`/workspace/${o.id}`}
                          className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-primary transition-colors" title="Buka Ruang Kerja">
                          <MessageSquare className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Detail Pesanan</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">#{selected.order_number}</p>
              </div>
              <button onClick={closeDetail} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Proyek</p>
                  <p className="text-sm font-bold text-slate-900">{getProjectTitle(selected)}</p>
                  {getPkgName(selected) && <p className="text-xs text-slate-500 mt-0.5">{getPkgName(selected)}</p>}
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Status</p>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border inline-block ${STATUS_COLORS[selected.status] || "bg-slate-50 text-slate-500 border-slate-200"}`}>
                    {selected.status.replace(/_/g, " ").replace("pending", "menunggu").replace("waiting payment", "menunggu pembayaran").replace("paid", "dibayar").replace("processing", "diproses").replace("completed", "selesai").replace("cancelled", "dibatalkan").replace("revision", "revisi")}
                  </span>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1"><Wallet className="w-3 h-3" /> Jumlah</p>
                  <p className="text-sm font-bold text-slate-900">Rp {Number(selected.total_amount || 0).toLocaleString("id-ID")}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Tanggal</p>
                  <p className="text-sm font-bold text-slate-900">
                    {new Date(selected.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-2">
                <Hash className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-mono text-xs text-slate-500 break-all">{selected.id}</span>
              </div>

              

              {(selected.status === "pending" || selected.status === "waiting_payment") && (
                <div className="space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Bukti Pembayaran</p>
                  {selected.status === "waiting_payment" && selected.payment_proof ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                      <AlertCircle className="w-5 h-5 text-amber-500 mx-auto mb-2" />
                      <p className="text-xs font-bold text-amber-700">Bukti telah dikirim. Menunggu konfirmasi admin.</p>
                      <a href={selected.payment_proof} target="_blank" rel="noopener noreferrer" className="text-[10px] text-amber-600 underline mt-1 block">Lihat bukti yang diunggah</a>
                    </div>
                  ) : (
                    <>
                      {paymentProofUrl && (
                        <div className="relative rounded-xl overflow-hidden border border-slate-200 h-32">
                          <img src={paymentProofUrl} alt="Payment proof" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => setPaymentProofUrl("")} className="absolute top-1.5 right-1.5 p-1 bg-white/90 rounded-lg text-red-500">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                      <div className="relative">
                        <input type="file" accept="image/*" onChange={handleUploadProof} disabled={uploadingProof} className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed z-10" />
                        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl px-4 py-3 flex items-center justify-center gap-2 text-slate-400 hover:bg-indigo-50 hover:border-indigo-200 hover:text-primary transition-all cursor-pointer">
                          {uploadingProof ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                          <span className="text-xs font-bold">{uploadingProof ? "Mengunggah..." : "Unggah Bukti Transfer"}</span>
                        </div>
                      </div>
                      {paymentProofUrl && (
                        <button type="button" onClick={handleSubmitProof} disabled={savingProof}
                          className="w-full py-2.5 bg-primary hover:bg-secondary text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                          {savingProof ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CreditCard className="w-4 h-4" /> Kirim Bukti Pembayaran</>}
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}

              

              {selected.product_id && selected.status === "completed" && selected.delivery_file && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">File Anda Sudah Siap</p>
                  <a
                    href={selected.delivery_file}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5 flex items-center justify-center gap-2">
                    <Download className="w-4 h-4" /> Unduh File Hasil
                  </a>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
              <Link href={`/workspace/${selected.id}`}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-primary hover:bg-secondary text-white py-2.5 rounded-xl text-sm font-bold transition-colors">
                <MessageSquare className="w-4 h-4" /> Buka Ruang Kerja
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}