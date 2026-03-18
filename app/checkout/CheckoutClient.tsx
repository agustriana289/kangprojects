"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ToastProvider";
import { CreditCard, ShieldCheck, CheckCircle2, Package, Mail, Phone, User, Ticket, Loader2, X, Tag, LogIn, MessageCircle } from "lucide-react";
import FadeIn from "@/components/landing/FadeIn";
import { calculateDiscountedPrice, Discount } from "@/utils/discounts";

declare global {
  interface Window {
    snap?: {
      pay: (token: string, options: {
        onSuccess?: (result: SnapResult) => void;
        onPending?: (result: SnapResult) => void;
        onError?: (result: SnapResult) => void;
        onClose?: () => void;
      }) => void;
    };
  }
}

interface SnapResult {
  order_id: string;
  transaction_status: string;
}

interface CheckoutClientProps {
  user: { id: string; email?: string; user_metadata?: { full_name?: string } } | null;
  item: { id: string; title: string; image_url?: string; form_fields?: { label: string; type: string; required: boolean; options?: string[] }[]; packages?: { name: string; price: number; features?: string[] }[] };
  type: "service" | "product";
  selectedPlan: { name: string; price: number; features?: string[] };
  initialDiscounts?: Discount[];
}

export default function CheckoutClient({ user, item, type, selectedPlan, initialDiscounts = [] }: CheckoutClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});

  const discounts = initialDiscounts;
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<Discount | null>(null);
  const [verifyingVoucher, setVerifyingVoucher] = useState(false);

  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [checkoutMode, setCheckoutMode] = useState<"account" | "whatsapp">("account");

  useEffect(() => {
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
    if (!clientKey) return;
    const isProduction = !clientKey.startsWith('SB-');
    const scriptSrc = isProduction
      ? "https://app.midtrans.com/snap/snap.js"
      : "https://app.sandbox.midtrans.com/snap/snap.js";
    if (document.getElementById("midtrans-snap")) return;
    const script = document.createElement("script");
    script.id = "midtrans-snap";
    script.src = scriptSrc;
    script.setAttribute("data-client-key", clientKey);
    document.head.appendChild(script);
    return () => {
      const s = document.getElementById("midtrans-snap");
      if (s) document.head.removeChild(s);
    };
  }, []);

  const handleFieldChange = (label: string, value: string) => {
    setFormData(prev => ({ ...prev, [label]: value }));
  };

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return;
    setVerifyingVoucher(true);
    try {
      const { data, error } = await supabase
        .from("store_discounts")
        .select("*")
        .eq("code", voucherCode.trim().toUpperCase())
        .eq("is_active", true)
        .single();

      if (error || !data) throw new Error("Kode voucher tidak ditemukan atau tidak aktif.");
      if (data.end_date && new Date(data.end_date) < new Date()) throw new Error("Voucher sudah kadaluarsa.");
      if (data.start_date && new Date(data.start_date) > new Date()) throw new Error("Voucher belum aktif.");
      if (data.usage_limit && data.used_count >= data.usage_limit) throw new Error("Batas penggunaan voucher sudah habis.");
      if (data.min_purchase > selectedPlan.price) throw new Error(`Minimum pembelian Rp ${new Intl.NumberFormat('id-ID').format(data.min_purchase)}.`);

      setAppliedVoucher(data);
      showToast("Voucher berhasil diterapkan!", "success");
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : "Terjadi kesalahan.", "error");
      setAppliedVoucher(null);
    } finally {
      setVerifyingVoucher(false);
    }
  };

  const getFinalPricing = () => {
    const basePrice = selectedPlan?.price || 0;
    const allDiscounts = appliedVoucher ? [appliedVoucher, ...discounts] : discounts;
    return calculateDiscountedPrice(basePrice, allDiscounts, item.id, type);
  };

  const { originalPrice, discountedPrice, appliedDiscount } = getFinalPricing();
  const TAX_RATE = user ? 0 : 0.02;
  const taxAmount = Math.round(discountedPrice * TAX_RATE);
  const totalWithTax = discountedPrice + taxAmount;

  const handleCheckout = async () => {
    if (!user) {
      if (!guestName.trim()) return showToast("Nama lengkap wajib diisi.", "error");
      if (!guestPhone.trim() || !/^[0-9]{9,15}$/.test(guestPhone.trim())) return showToast("Nomor HP tidak valid.", "error");
    }

    if (item.form_fields && item.form_fields.length > 0) {
      for (const field of item.form_fields) {
        if (field.required && !formData[field.label]) {
          return showToast(`Harap isi field wajib: ${field.label}`, "error");
        }
      }
    }

    setLoading(true);
    try {
      const orderNumber = `ORD-${Date.now()}`;
      const insertPayload: Record<string, unknown> = {
        order_number: orderNumber,
        service_id: type === "service" ? item.id : null,
        product_id: type === "product" ? item.id : null,
        selected_package: selectedPlan,
        form_data: formData,
        total_amount: totalWithTax,
        status: 'pending',
        payment_status: 'unpaid',
        discount_id: appliedDiscount?.id || null,
      };

      if (user) {
        insertPayload.user_id = user.id;
      } else {
        insertPayload.guest_name = guestName.trim();
        insertPayload.guest_phone = guestPhone.trim();
      }

      const { data: orderData, error: orderError } = await supabase
        .from('store_orders')
        .insert(insertPayload)
        .select()
        .single();

      if (orderError) throw orderError;

      if (appliedDiscount?.id) {
        await supabase.rpc('increment_discount_usage', { discount_id: appliedDiscount.id });
      }

      if (user) {
        await supabase.from('user_activities').insert({
          user_id: user.id,
          title: `${type === "service" ? "Permintaan layanan" : "Pembelian produk"} dikirim untuk`,
          highlight: `#${orderData.id.split('-')[0].toUpperCase()}`,
          highlight_color: 'text-primary',
        });
      }

      const customerName = user ? (user.user_metadata?.full_name || user.email) : guestName;
      const customerEmail = user ? user.email : `guest_${guestPhone}@guest.local`;

      const tokenRes = await fetch("/api/midtrans/create-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderData.id,
          amount: totalWithTax,
          customerName,
          customerEmail,
          itemName: `${item.title} - ${selectedPlan.name}`,
        }),
      });

      const { token, error: tokenError } = await tokenRes.json();
      if (tokenError || !token) throw new Error(tokenError || "Gagal mendapatkan token pembayaran.");

      setLoading(false);

      window.snap?.pay(token, {
        onSuccess: () => {
          showToast("Pembayaran berhasil! Terima kasih.", "success");
          if (user) router.push(`/workspace/${orderData.id}`);
          else router.push(`/?order=${orderData.order_number}`);
        },
        onPending: () => {
          showToast("Pembayaran pending. Order Anda akan diproses setelah konfirmasi.", "info");
          router.push("/");
        },
        onError: () => {
          showToast("Pembayaran gagal. Silakan coba lagi.", "error");
        },
        onClose: () => {
          showToast("Jendela pembayaran ditutup.", "info");
          router.push("/");
        },
      });

    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : "Terjadi kesalahan.", "error");
      setLoading(false);
    }
  };

  return (
    <FadeIn delay={150}>
      <div className="bg-white rounded-3xl shadow-sm ring-1 ring-slate-100 overflow-hidden mb-6 flex flex-col md:flex-row">

        <div className="flex-1 p-8 border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2 mb-6 border-b border-slate-200 pb-4">
             <Package size={20} className="text-primary" />
             Ringkasan Pesanan
          </h2>

          <div className="flex items-start gap-4 mb-6">
            <div className="h-20 w-20 shrink-0 bg-white flex items-center justify-center rounded-2xl ring-1 ring-slate-200 overflow-hidden shadow-sm">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <Package size={24} className="text-slate-400" />
                )}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1 block bg-indigo-50 px-2 py-0.5 rounded-md w-fit ring-1 ring-indigo-100">
                {type === "service" ? "Service" : "Product"}
              </span>
              <h3 className="text-lg font-bold text-slate-900 leading-snug">{item.title}</h3>
              <p className="text-sm text-slate-500 mt-1">Plan: <span className="font-semibold text-slate-700">{selectedPlan.name}</span></p>
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between text-sm text-slate-500 font-medium">
              <span>Subtotal</span>
              <span className="text-slate-900 font-bold">Rp {Number(originalPrice).toLocaleString('id-ID')}</span>
            </div>
            {appliedDiscount && (
              <div className="flex items-center justify-between text-sm text-emerald-600 font-bold pb-2">
                <span className="flex items-center gap-1.5"><Tag size={14} /> Diskon ({appliedDiscount.name})</span>
                <span>- Rp {Number(originalPrice - discountedPrice).toLocaleString('id-ID')}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm text-slate-500 font-medium pb-4 border-b border-slate-200">
              <span>{user ? "Pajak & Biaya" : "Pajak (2%)"}</span>
              <span className="text-slate-900 font-bold">
                {user ? "Gratis" : `Rp ${taxAmount.toLocaleString('id-ID')}`}
              </span>
            </div>
            <div className="flex items-center justify-between text-lg pt-2">
              <span className="font-extrabold text-slate-900">Harga Total</span>
              <div className="text-right">
                {appliedDiscount && (
                  <span className="text-xs text-slate-400 line-through mr-2 font-medium">Rp {(Number(originalPrice) + Math.round(Number(originalPrice) * TAX_RATE)).toLocaleString('id-ID')}</span>
                )}
                <span className="font-extrabold text-primary tracking-tight">Rp {totalWithTax.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-white rounded-2xl p-5 ring-1 ring-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-2">
              <Ticket size={16} className="text-primary" /> Punya kode promo?
            </h4>
            <div className="flex gap-2">
              <input
                type="text"
                value={voucherCode}
                onChange={e => setVoucherCode(e.target.value)}
                placeholder="Masukkan kode"
                className="flex-1 bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold uppercase tracking-wider rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-secondary px-4 py-2.5 transition-all outline-none"
              />
              <button
                onClick={handleApplyVoucher}
                disabled={verifyingVoucher || !voucherCode.trim()}
                className="bg-primary hover:bg-secondary text-white px-5 rounded-xl text-sm font-bold shadow-sm transition-colors disabled:opacity-50"
              >
                {verifyingVoucher ? <Loader2 className="w-4 h-4 animate-spin" /> : "Pakai"}
              </button>
            </div>
            {appliedVoucher && (
              <div className="mt-3 flex items-center justify-between bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg text-xs font-bold ring-1 ring-emerald-200/50">
                <span className="flex items-center gap-1.5"><CheckCircle2 size={14} /> Voucher Diterapkan</span>
                <button onClick={() => setAppliedVoucher(null)} className="hover:text-emerald-900 transition-colors"><X size={14} /></button>
              </div>
            )}
          </div>

          {selectedPlan.features && selectedPlan.features.length > 0 && (
            <div className="mt-6">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Termasuk dalam {selectedPlan.name}</h4>
              <ul className="space-y-2.5">
                {selectedPlan.features.map((feat: string, i: number) => (
                  <li key={i} className="flex gap-x-3 text-sm text-slate-600">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="w-full md:w-[55%] p-8 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
              <Mail size={20} className="text-primary" />
              Informasi
            </h2>

            {user ? (
              <div className="mb-6">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Alamat Email</label>
                <div className="w-full bg-slate-50 border-0 ring-1 ring-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium opacity-80 cursor-not-allowed">
                  {user.email}
                </div>
                <p className="text-[10px] uppercase tracking-wider text-emerald-600 mt-2 flex items-center gap-1.5 font-bold">
                   <ShieldCheck size={14} /> Masuk secara aman
                </p>
              </div>
            ) : (
              <div className="mb-6 space-y-4">
                <div className="flex rounded-xl overflow-hidden ring-1 ring-slate-200">
                  <button
                    onClick={() => setCheckoutMode("account")}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold transition-colors ${
                      checkoutMode === "account"
                        ? "bg-primary text-white"
                        : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    <LogIn size={15} /> Masuk / Daftar
                  </button>
                  <button
                    onClick={() => setCheckoutMode("whatsapp")}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold transition-colors ${
                      checkoutMode === "whatsapp"
                        ? "bg-primary text-white"
                        : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    <MessageCircle size={15} /> Pakai WhatsApp
                  </button>
                </div>

                {checkoutMode === "account" ? (
                  <div className="bg-slate-50 rounded-2xl p-5 ring-1 ring-slate-200 text-center space-y-3">
                    <p className="text-sm text-slate-600">Masuk atau buat akun untuk melanjutkan checkout dan memantau status pesanan.</p>
                    <button
                      onClick={() => {
                        const supabase = createClient();
                        const next = `/checkout?type=${type}&slug=${item.id}&plan=${encodeURIComponent(selectedPlan.name)}`;
                        supabase.auth.signInWithOAuth({
                          provider: "google",
                          options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
                        });
                      }}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 px-6 text-sm font-bold text-white hover:bg-secondary transition-colors shadow-sm"
                    >
                      <LogIn size={16} /> Masuk dengan Google
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                        Nama Lengkap <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={guestName}
                          onChange={e => setGuestName(e.target.value)}
                          placeholder="Contoh: Budi Santoso"
                          className="w-full bg-white border border-slate-200 text-slate-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-secondary pl-10 pr-4 py-3 transition-all outline-none shadow-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                        Nomor WhatsApp <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="tel"
                          value={guestPhone}
                          onChange={e => setGuestPhone(e.target.value.replace(/\D/g, ''))}
                          placeholder="Contoh: 08123456789"
                          maxLength={15}
                          className="w-full bg-white border border-slate-200 text-slate-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-secondary pl-10 pr-4 py-3 transition-all outline-none shadow-sm"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1.5">Kami akan menghubungi Anda via WhatsApp setelah pembayaran.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {item.form_fields && item.form_fields.length > 0 && (
            <div className="mt-4 border-t border-slate-100 pt-6">
              <h2 className="text-sm font-bold tracking-tight text-slate-900 mb-5 uppercase">
                Persyaratan Proyek
              </h2>
              <div className="space-y-5">
                {item.form_fields.map((field, idx: number) => (
                  <div key={idx}>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                      {field.label} {field.required && <span className="text-rose-500">*</span>}
                    </label>
                    {field.type === "textarea" ? (
                      <textarea
                        required={field.required}
                        value={formData[field.label] || ""}
                        onChange={(e) => handleFieldChange(field.label, e.target.value)}
                        rows={3}
                        className="w-full bg-white border border-slate-200 text-slate-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-secondary p-3 transition-all outline-none resize-none shadow-sm"
                        placeholder={`Masukkan ${field.label.toLowerCase()}`}
                      />
                    ) : field.type === "select" && field.options ? (
                      <select
                        required={field.required}
                        value={formData[field.label] || ""}
                        onChange={(e) => handleFieldChange(field.label, e.target.value)}
                        className="w-full bg-white border border-slate-200 text-slate-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-secondary p-3 transition-all outline-none shadow-sm"
                      >
                        <option value="" disabled>Pilih sebuah opsi</option>
                        {field.options.map((opt: string) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type === 'file' ? 'url' : 'text'}
                        required={field.required}
                        value={formData[field.label] || ""}
                        onChange={(e) => handleFieldChange(field.label, e.target.value)}
                        className="w-full bg-white border border-slate-200 text-slate-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-secondary p-3 transition-all outline-none shadow-sm"
                        placeholder={field.type === 'file' ? 'Sediakan link Google Drive...' : `Masukkan ${field.label.toLowerCase()}`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 pt-8 border-t border-slate-100">
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-4 px-8 text-sm font-bold uppercase tracking-wider text-white shadow-sm hover:bg-secondary hover:shadow-primary/30 hover:shadow-lg focus:ring-4 focus:ring-indigo-100 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <CreditCard size={18} />
                  Checkout - Rp {totalWithTax.toLocaleString('id-ID')}
                </>
              )}
            </button>
            <p className="text-center text-[10px] uppercase tracking-wider text-slate-400 font-bold mt-4 leading-relaxed max-w-[250px] mx-auto">
              Dengan mengkonfirmasi, Anda menyetujui Ketentuan Layanan kami.
            </p>
          </div>
        </div>

      </div>
    </FadeIn>
  );
}