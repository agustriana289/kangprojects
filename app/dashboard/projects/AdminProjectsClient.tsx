"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  BarChart3, LayoutGrid, Tag, Search, ChevronDown, Trash2, Eye, ExternalLink, Mail, Edit3,
  ChevronRight, ChevronLeft, Loader2, Check, FileText, Phone, Users, Briefcase, Plus, PartyPopper, MessageSquare, Copy, Star, X, Send, Calendar, Wallet, TrendingUp, Paperclip, Upload
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ToastProvider";
import Link from "next/link";
import { createPortal } from "react-dom";

type ViewMode = "table" | "status" | "layanan" | "klien" | "grafik";

const CURRENT_YEAR = new Date().getFullYear();
const PAGE_SIZE = 100;

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  pending:         { label: "No Status",     color: "#9b9b9b", bg: "#f5f5f4", dot: "#9b9b9b" },
  waiting_payment: { label: "Belum Dibayar", color: "#b45309", bg: "#fffbeb", dot: "#f59e0b" },
  cancelled:       { label: "Dibatalkan",    color: "#dc2626", bg: "#fef2f2", dot: "#ef4444" },
  paid:            { label: "Dibayar",       color: "#1d4ed8", bg: "#eff6ff", dot: "#3b82f6" },
  processing:      { label: "Dikerjakan",    color: "#7c3aed", bg: "#f5f3ff", dot: "#8b5cf6" },
  completed:       { label: "Selesai",       color: "#047857", bg: "#ecfdf5", dot: "#10b981" },
};

const ALL_STATUSES = Object.keys(STATUS_CONFIG);
const IDR_FULL = (n: number) => `Rp ${Number(n || 0).toLocaleString("id-ID")}`;
const IDR = (n: number) =>
  n >= 1_000_000_000 ? `Rp ${(n / 1_000_000_000).toFixed(n % 1_000_000_000 === 0 ? 0 : 1)}M`
  : n >= 1_000_000 ? `Rp ${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}Jt`
  : n >= 1_000 ? `Rp ${Math.round(n / 1_000)}K`
  : `Rp ${n.toLocaleString("id-ID")}`;

function StatusBadge({ status, onClick }: { status: string; onClick?: () => void }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <button
      onClick={onClick}
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}22` }}
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold whitespace-nowrap transition-opacity hover:opacity-80"
    >
      <span style={{ background: cfg.dot }} className="w-1.5 h-1.5 rounded-full shrink-0" />
      {cfg.label}
    </button>
  );
}

function InlineText({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  useEffect(() => { setDraft(value); }, [value]);
  const commit = () => { setEditing(false); if (draft !== value) onChange(draft); };
  return editing ? (
    <input autoFocus value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit}
      onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setDraft(value); setEditing(false); } }}
      className="w-full text-sm border-0 outline-none bg-blue-50 rounded px-2 py-0.5 ring-2 ring-primary/30 text-slate-900 font-medium" />
  ) : (
    <div onClick={() => setEditing(true)} className="text-sm text-slate-700 hover:bg-slate-50 px-2 py-0.5 rounded cursor-text min-h-[26px] flex items-center transition-colors">
      {value || <span className="text-slate-300 italic">{placeholder || "—"}</span>}
    </div>
  );
}

function InlineNumber({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  useEffect(() => { setDraft(String(value)); }, [value]);
  const commit = () => { setEditing(false); const num = Number(draft.replace(/\D/g, "")); if (num !== value) onChange(num); };
  return editing ? (
    <input autoFocus type="number" value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit}
      onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setDraft(String(value)); setEditing(false); } }}
      className="w-full text-sm border-0 outline-none bg-blue-50 rounded px-2 py-0.5 ring-2 ring-primary/30 text-slate-900 font-medium" />
  ) : (
    <div onClick={() => setEditing(true)} className="text-sm text-slate-700 hover:bg-slate-50 px-2 py-0.5 rounded cursor-text min-h-[26px] flex items-center transition-colors">
      {value > 0 ? IDR_FULL(value) : <span className="text-slate-300 italic">—</span>}
    </div>
  );
}

function InlineStatus({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler); return () => document.removeEventListener("mousedown", handler);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <StatusBadge status={value} onClick={() => setOpen(o => !o)} />
      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 bg-white shadow-xl border border-slate-200 rounded-xl overflow-hidden min-w-[160px]">
          {ALL_STATUSES.map(st => {
            const cfg = STATUS_CONFIG[st];
            return (
              <button key={st} onClick={() => { onChange(st); setOpen(false); }} className="flex items-center gap-2 w-full px-3 py-2 hover:bg-slate-50 text-left transition-colors">
                <span style={{ background: cfg.dot }} className="w-2 h-2 rounded-full shrink-0" />
                <span style={{ color: cfg.color }} className="text-sm font-medium">{cfg.label}</span>
                {value === st && <Check className="w-3 h-3 ml-auto text-primary" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function InlineLayanan({ serviceId, packageName, services, onChangeService, onChangePackage }: any) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const currentService = services.find((s: any) => s.id === serviceId);
  const packages = currentService?.packages || [];
  const display = currentService
    ? `${currentService.title}${packageName && packageName !== "—" ? ` - ${packageName}` : ""}`
    : (packageName && packageName !== "—" ? packageName : "—");
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler); return () => document.removeEventListener("mousedown", handler);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen(o => !o)} className="text-sm text-slate-700 hover:bg-slate-50 px-2 py-0.5 rounded cursor-pointer min-h-[26px] flex items-center transition-colors">
        {display || <span className="text-slate-300 italic">—</span>}
      </div>
      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 bg-white shadow-xl border border-slate-200 rounded-xl overflow-hidden min-w-[240px]">
          <div className="px-3 py-2 border-b border-slate-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Layanan</p>
            <div className="space-y-0.5 max-h-40 overflow-y-auto">
              {services.map((svc: any) => (
                <button key={svc.id} onClick={() => onChangeService(svc.id)} className="flex items-center gap-2 w-full px-2 py-1.5 hover:bg-slate-50 text-left rounded transition-colors">
                  <span className="text-sm text-slate-700 flex-1">{svc.title}</span>
                  {svc.id === serviceId && <Check className="w-3 h-3 text-primary shrink-0" />}
                </button>
              ))}
            </div>
          </div>
          {packages.length > 0 && (
            <div className="px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Paket</p>
              <div className="space-y-0.5">
                {packages.map((pkg: any) => (
                  <button key={pkg.name} onClick={() => { onChangePackage(pkg.name); setOpen(false); }} className="flex items-center gap-2 w-full px-2 py-1.5 hover:bg-slate-50 text-left rounded transition-colors">
                    <span className="text-sm text-slate-700 flex-1">{pkg.name}</span>
                    {pkg.name === packageName && <Check className="w-3 h-3 text-primary shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function extractPlaceholders(html: string): string[] {
  const matches = html.match(/\{\{(\w+)\}\}/g) || [];
  return [...new Set(matches.map((m) => m.slice(2, -2)))];
}

function YearNavigator({ years, selectedYear, onSelect }: { years: number[]; selectedYear: number; onSelect: (y: number) => void }) {
  const MAX_VISIBLE = 10;
  const [offset, setOffset] = useState(() => {
    const idx = years.indexOf(selectedYear);
    return Math.max(0, idx - MAX_VISIBLE + 1);
  });
  const visible = years.slice(offset, offset + MAX_VISIBLE);
  const canPrev = offset > 0;
  const canNext = offset + MAX_VISIBLE < years.length;
  return (
    <div className="border-t border-slate-100 px-6 py-3 flex items-center gap-1.5">
      {canPrev && (
        <button onClick={() => setOffset(o => Math.max(0, o - 1))} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      )}
      {visible.map(y => (
        <button
          key={y}
          onClick={() => !isCurrentYear(y, selectedYear) && onSelect(y)}
          disabled={y === selectedYear}
          className={`px-3 py-1 rounded-lg text-sm font-semibold transition-all ${
            y === selectedYear
              ? "bg-primary text-white shadow-sm cursor-default"
              : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          {y}
        </button>
      ))}
      {canNext && (
        <button onClick={() => setOffset(o => Math.min(years.length - MAX_VISIBLE, o + 1))} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

function isCurrentYear(y: number, selected: number) { return y === selected; }

export default function AdminProjectsClient() {
  const supabase = createClient();
  const { showToast } = useToast();

  const [orders, setOrders] = useState<Record<string, unknown>[]>([]);
  const [servicesList, setServicesList] = useState<{ id: string; title: string; packages: { name: string }[] }[]>([]);
  const [allCharges, setAllCharges] = useState<Record<string, number>>({});
  const [allChargeItems, setAllChargeItems] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("table");
  const [search, setSearch] = useState("");
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ project_title: "", customer_name: "", whatsapp: "", customer_email: "", total_amount: "", status: "pending" as string, service_id: "", package_name: "" });
  const [addSaving, setAddSaving] = useState(false);
  const [syncingTickTick, setSyncingTickTick] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Cards state
  const [stats, setStats] = useState({
    topClient: { name: "-", count: 0, amount: 0 },
    topItem: { name: "-", count: 0, amount: 0 },
    monthlyOrderCount: 0,
    monthlyOrderAmount: 0,
    totalOrderCount: 0,
    totalOrderAmount: 0,
  });

  // Modal Detail & Email state
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [modalView, setModalView] = useState<"detail" | "email" | "edit">("detail");
  const [isSlideOpen, setIsSlideOpen] = useState(false);
  const [domains, setDomains] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  
  // Additional Charges State
  const [newChargeDesc, setNewChargeDesc] = useState("");
  const [newChargeAmount, setNewChargeAmount] = useState("");
  const [isAddingCharge, setIsAddingCharge] = useState(false);
  
  // Email Form State
  const [sendFromId, setSendFromId] = useState("");
  const [sendTemplateId, setSendTemplateId] = useState("");
  const [sendAttachment, setSendAttachment] = useState<File | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [emailNotification, setEmailNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  
  // Edit Form State
  const [editFormData, setEditFormData] = useState<any>({});

  const getFormData = (o: Record<string, unknown>) => {
    try { return typeof o.form_data === "string" ? JSON.parse(o.form_data) : (o.form_data as Record<string, unknown> || {}); }
    catch { return {}; }
  };
  const getProjectTitle = (o: Record<string, unknown>) => {
    const fd = getFormData(o);
    return (fd["project_title"] || fd["Project Title"] || fd["Nama Logo"] || "") as string;
  };
  const getClientName = (o: Record<string, unknown>) => {
    const client = o.client as Record<string, unknown> | null;
    if (client?.full_name) return client.full_name as string;
    if (client?.email) return (client.email as string).split("@")[0];
    if (o.guest_name) return o.guest_name as string;
    const fd = getFormData(o);
    return (fd.customer_name || fd["Client Name"] || "—") as string;
  };
  const getClientEmail = (o: Record<string, unknown>) => {
    const client = o.client as Record<string, unknown> | null;
    if (client?.email) return client.email as string;
    const fd = getFormData(o);
    return (fd.email || fd.customer_email || "") as string;
  };
  const getClientWhatsApp = (o: Record<string, unknown>) => {
    if (o.guest_phone) return o.guest_phone as string;
    const fd = getFormData(o);
    return (fd.whatsapp || "—") as string;
  };
  const getServiceTitle = (o: Record<string, unknown>) => {
    const svc = o.store_services as Record<string, unknown> | null;
    const prd = o.store_products as Record<string, unknown> | null;
    return (svc?.title || prd?.title || o.custom_item_name || "") as string;
  };
  const getPackageName = (o: Record<string, unknown>) => {
    try {
      const sp = typeof o.selected_package === "string" ? JSON.parse(o.selected_package) : o.selected_package as Record<string, unknown> | null;
      return (sp?.name || o.custom_package_name || "") as string;
    } catch { return (o.custom_package_name || "") as string; }
  };

  const calculateStats = (data: any[], chargeMap: Record<string, number>) => {
    const completedStats = data.filter(o => ['paid', 'processing', 'completed'].includes(o.status));

    const clientStats: Record<string, { count: number; amount: number; name: string }> = {};
    let topC = { name: "Belum ada pesanan", count: 0, amount: 0 };
    
    const itemStats: Record<string, { count: number; amount: number; name: string }> = {};
    let topI = { name: "Belum ada pesanan", count: 0, amount: 0 };

    const currentMonthIdx = new Date().getMonth();
    const currentYr = new Date().getFullYear();
    let mCount = 0;
    let mAmount = 0;
    let tCount = completedStats.length;
    let tAmount = 0;

    completedStats.forEach(o => {
      const amt = Number(o.total_amount || 0) + (chargeMap[o.id] || 0);
      tAmount += amt;

      const d = new Date(o.created_at);
      if (d.getMonth() === currentMonthIdx && d.getFullYear() === currentYr) {
        mCount++;
        mAmount += amt;
      }

      const cName = getClientName(o);
      if (cName !== "—") {
        if (!clientStats[cName]) clientStats[cName] = { count: 0, amount: 0, name: cName };
        clientStats[cName].count++;
        clientStats[cName].amount += amt;
        if (clientStats[cName].count > topC.count) topC = clientStats[cName];
      }

      const iName = getServiceTitle(o) || "Proyek";
      if (!itemStats[iName]) itemStats[iName] = { count: 0, amount: 0, name: iName };
      itemStats[iName].count++;
      itemStats[iName].amount += amt;
      if (itemStats[iName].count > topI.count) topI = itemStats[iName];
    });

    setStats({
      topClient: topC,
      topItem: topI,
      monthlyOrderCount: mCount,
      monthlyOrderAmount: mAmount,
      totalOrderCount: tCount,
      totalOrderAmount: tAmount,
    });
  };

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data: profiles } = await supabase.from("users").select("id, full_name, email");
      const profileMap: Record<string, Record<string, unknown>> = {};
      (profiles || []).forEach((p: Record<string, unknown>) => { if (p.id) profileMap[p.id as string] = p; });
      
      const [
        { data, error }, 
        { data: svcs }, 
        { data: doms }, 
        { data: tmpls }
      ] = await Promise.all([
        supabase.from("store_orders").select("*, store_products(title, category), store_services(title, category)").order("created_at", { ascending: false }),
        supabase.from("store_services").select("id, title, packages").order("sort_order", { ascending: true }),
        supabase.from("email_domains").select("*"),
        supabase.from("email_templates").select("*")
      ]);
      if (error) throw error;

      setDomains(doms || []);
      setTemplates(tmpls || []);

      const mapped = (data || []).map(o => ({ ...o, client: profileMap[o.user_id as string] || null }));
      setOrders(mapped);
      setServicesList(svcs || []);

      const ids = mapped.map(o => o.id as string);
      let chargeMap: Record<string, number> = {};
      let chargeItemsMap: Record<string, any[]> = {};
      if (ids.length > 0) {
        const { data: charges } = await supabase.from("order_additional_charges").select("*").in("order_id", ids);
        (charges || []).forEach((c: any) => {
          chargeMap[c.order_id] = (chargeMap[c.order_id] || 0) + Number(c.amount || 0);
          if (!chargeItemsMap[c.order_id]) chargeItemsMap[c.order_id] = [];
          chargeItemsMap[c.order_id].push(c);
        });
        setAllCharges(chargeMap);
        setAllChargeItems(chargeItemsMap);
      }
      
      calculateStats(mapped, chargeMap);
    } catch (err: unknown) {
      showToast((err as Error).message || "Gagal memuat data", "error");
    } finally {
      setLoading(false);
    }
  }, [supabase, showToast]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => { setPage(1); }, [view, search, selectedYear]);

  // Auto-populate total_amount based on selected service and package
  useEffect(() => {
    if (addForm.service_id && addForm.package_name) {
      const selectedService = servicesList.find(s => s.id === addForm.service_id);
      if (selectedService) {
        const selectedPackage = (selectedService.packages as any[]).find((p: any) => p.name === addForm.package_name);
        if (selectedPackage && selectedPackage.price) {
          setAddForm(prev => ({ ...prev, total_amount: String(selectedPackage.price) }));
        }
      }
    }
  }, [addForm.service_id, addForm.package_name, servicesList]);

  const updateField = async (id: string, field: string, value: string | number) => {
    setSaving(s => ({ ...s, [id]: true }));
    const { error } = await supabase.from("store_orders").update({ [field]: value }).eq("id", id);
    if (error) showToast("Gagal menyimpan", "error");
    else setOrders(prev => prev.map(o => o.id === id ? { ...o, [field]: value } : o));
    setSaving(s => ({ ...s, [id]: false }));
  };

  const updateFormField = async (id: string, o: Record<string, unknown>, extra: Record<string, unknown>) => {
    setSaving(s => ({ ...s, [id]: true }));
    const { error } = await supabase.from("store_orders").update(extra).eq("id", id);
    if (error) showToast("Gagal menyimpan", "error");
    else fetchOrders();
    setSaving(s => ({ ...s, [id]: false }));
  };

  const updateServiceAndPackage = async (id: string, serviceId: string, pkgName: string, o: Record<string, unknown>) => {
    setSaving(s => ({ ...s, [id]: true }));
    const { error } = await supabase.from("store_orders").update({
      service_id: serviceId,
      selected_package: { name: pkgName },
      form_data: getFormData(o),
    }).eq("id", id);
    if (error) showToast("Gagal menyimpan", "error");
    else fetchOrders();
    setSaving(s => ({ ...s, [id]: false }));
  };

  const deleteProject = async (id: string) => {
    if (!confirm("Hapus proyek ini secara permanen?")) return;
    const { error } = await supabase.from("store_orders").delete().eq("id", id);
    if (error) showToast("Gagal menghapus", "error");
    else { showToast("Selesai dihapus", "success"); setIsSlideOpen(false); fetchOrders(); }
  };

  const handleAddCharge = async () => {
    if (!newChargeDesc || !newChargeAmount || !selectedProject) return;
    setIsAddingCharge(true);
    const { error } = await supabase.from("order_additional_charges").insert({
      order_id: selectedProject.id,
      description: newChargeDesc,
      amount: newChargeAmount
    });
    if (error) showToast("Gagal menambah biaya tambahan", "error");
    else {
      setNewChargeDesc("");
      setNewChargeAmount("");
      showToast("Biaya tambahan tersimpan", "success");
      fetchOrders();
    }
    setIsAddingCharge(false);
  };

  const handleDeleteCharge = async (id: string) => {
    const { error } = await supabase.from("order_additional_charges").delete().eq("id", id);
    if (!error) { showToast("Biaya dihapus", "success"); fetchOrders(); }
  };

  const generateTestimonial = async (id: string) => {
    try {
      const res = await fetch("/api/testimonial/generate-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal generate link");
      }
      navigator.clipboard.writeText(`${window.location.origin}/testimonials/submit/${id}`);
      showToast("Link testimoni disalin! Berlaku 7 hari.", "success");
    } catch (err: any) {
      showToast(err.message || "Gagal generate link", "error");
    }
  };

  const handleSendEmail = async () => {
    if (!sendTemplateId) return setEmailNotification({ type: "error", message: "Pilih template email terlebih dahulu" });
    const toEmail = getClientEmail(selectedProject);
    if (!toEmail) return setEmailNotification({ type: "error", message: "Klien tidak memiliki email" });
    
    setSendingEmail(true);
    setEmailNotification(null);
    try {
      const placeholders: Record<string, string> = {
        nama_klien: getClientName(selectedProject),
        nama: getClientName(selectedProject),
        nama_proyek: getProjectTitle(selectedProject),
        email: toEmail,
        no_hp: getClientWhatsApp(selectedProject),
        invoice: selectedProject.order_number,
        nama_layanan: getServiceTitle(selectedProject),
        paket: getPackageName(selectedProject),
        total_harga: String(Number(selectedProject.total_amount || 0) + (allCharges[selectedProject.id] || 0)),
      };

      const formData = new FormData();
      formData.append("to", toEmail);
      formData.append("isBroadcast", "false");
      if (sendFromId) formData.append("fromDomainId", sendFromId);
      formData.append("templateId", sendTemplateId);
      formData.append("placeholders", JSON.stringify(placeholders));
      if (sendAttachment) formData.append("attachment", sendAttachment);

      const res = await fetch("/api/email/send", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Gagal mengirim email");
      setEmailNotification({ type: "success", message: "File akhir berhasil dikirim ke klien!" });
      setTimeout(() => {
        setSendAttachment(null); setSendTemplateId(""); setSendFromId("");
        setUploadProgress(0);
        setModalView("detail");
        setEmailNotification(null);
      }, 2000);
    } catch (err: any) {
      setEmailNotification({ type: "error", message: err.message || "Gagal mengirim file" });
    } finally {
      setSendingEmail(false);
    }
  };

  const sendToTickTick = async (title: string, content: string) => {
    try {
      await fetch("/api/ticktick/create-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
    } catch {
    }
  };

  const handleSyncAllToTickTick = async () => {
    setSyncingTickTick(true);
    try {
      const res = await fetch("/api/ticktick/sync-orders", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal sinkronisasi");
      showToast(data.message || "Sinkronisasi selesai", "success");
      fetchOrders();
    } catch (err: any) {
      showToast(err.message || "Gagal sinkronisasi ke TickTick", "error");
    } finally {
      setSyncingTickTick(false);
    }
  };

  const handleAddCustomProject = async () => {
    if (!addForm.project_title) return showToast("Judul proyek wajib diisi", "error");
    setAddSaving(true);
    const fd = {
      project_title: addForm.project_title,
      "Project Title": addForm.project_title,
      customer_name: addForm.customer_name,
      "Client Name": addForm.customer_name,
      whatsapp: addForm.whatsapp,
      email: addForm.customer_email,
    };
    const insertPayload: Record<string, unknown> = {
      status: addForm.status,
      total_amount: addForm.total_amount ? Number(addForm.total_amount) : 0,
      form_data: fd,
      order_number: `CUSTOM-${Date.now()}`,
      selected_package: addForm.package_name ? { name: addForm.package_name } : {},
    };
    if (addForm.service_id) insertPayload.service_id = addForm.service_id;
    const { error } = await supabase.from("store_orders").insert(insertPayload);
    if (error) showToast("Gagal menambah proyek: " + error.message, "error");
    else {
      showToast("Proyek berhasil ditambahkan", "success");
      setShowAddModal(false);
      const svcTitle = servicesList.find(s => s.id === addForm.service_id)?.title || "";
      const content = [
        addForm.customer_name && `Klien: ${addForm.customer_name}`,
        addForm.whatsapp && `WhatsApp: ${addForm.whatsapp}`,
        svcTitle && `Layanan: ${svcTitle}${addForm.package_name ? ` - ${addForm.package_name}` : ""}`,
        addForm.total_amount && `Total: Rp ${Number(addForm.total_amount).toLocaleString("id-ID")}`,
      ].filter(Boolean).join("\n");
      const tickTitle = addForm.total_amount
        ? `${addForm.project_title} / Rp ${Number(addForm.total_amount).toLocaleString("id-ID")}`
        : addForm.project_title;
      sendToTickTick(tickTitle, content);
      setAddForm({ project_title: "", customer_name: "", whatsapp: "", customer_email: "", total_amount: "", status: "pending", service_id: "", package_name: "" });
      fetchOrders();
    }
    setAddSaving(false);
  };

  const handleSaveEdit = async () => {
    const fd = getFormData(selectedProject);
    const updatedFd = {
      ...fd,
      customer_name: editFormData.customer_name,
      "Client Name": editFormData.customer_name,
      email: editFormData.customer_email,
      whatsapp: editFormData.whatsapp,
      project_title: editFormData.project_title,
      "Project Title": editFormData.project_title,
    };
    const updatePayload: any = {
      status: editFormData.status,
      total_amount: Number(editFormData.total_amount) || 0,
      payment_method: editFormData.payment_method,
      form_data: {
        ...updatedFd,
        discount_amount: Number(editFormData.discount_amount) || 0,
        progress: Number(editFormData.progress) || 0,
      },
    };
    if (editFormData.service_id) {
      updatePayload.service_id = editFormData.service_id;
      updatePayload.selected_package = editFormData.package_name ? { name: editFormData.package_name } : {};
    }
    if (selectedProject.guest_name !== undefined) updatePayload.guest_name = editFormData.customer_name;
    if (selectedProject.guest_phone !== undefined) updatePayload.guest_phone = editFormData.whatsapp;

    const { error } = await supabase.from("store_orders").update(updatePayload).eq("id", selectedProject.id);
    if (error) { showToast("Gagal menyimpan: " + error.message, "error"); return; }
    const updatedProject = { ...selectedProject, ...updatePayload };
    setSelectedProject(updatedProject);
    setOrders(prev => prev.map(o => o.id === selectedProject.id ? updatedProject : o));
    showToast("Perubahan disimpan", "success");
    setModalView("detail");
    fetchOrders();
  };

  const openSlide = (o: any, v: "detail" | "email" | "edit" = "detail") => {
    setSelectedProject(o);
    if (v === "edit") {
      const fd = getFormData(o);
      setEditFormData({
        status: o.status,
        total_amount: o.total_amount,
        discount_amount: fd.discount_amount ?? o.discount_amount ?? 0,
        payment_method: o.payment_method || "",
        progress: fd.progress ?? o.progress ?? 0,
        customer_name: getClientName(o),
        customer_email: getClientEmail(o),
        whatsapp: getClientWhatsApp(o),
        project_title: getProjectTitle(o),
        service_id: (o.service_id as string) || "",
        package_name: getPackageName(o),
      });
    }
    const defaultDomain = domains.find(d => d.is_default)?.id || "";
    setSendFromId(defaultDomain);
    setModalView(v);
    setIsSlideOpen(true);
  };

  const filtered = orders.filter(o => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      getProjectTitle(o).toLowerCase().includes(q) ||
      getClientName(o).toLowerCase().includes(q) ||
      getServiceTitle(o).toLowerCase().includes(q) ||
      getPackageName(o).toLowerCase().includes(q) ||
      (o.order_number as string)?.toLowerCase().includes(q)
    );
  });

  const allYears = Array.from(new Set(orders.map(o => new Date(o.created_at as string).getFullYear()))).sort((a, b) => a - b);
  const tableFiltered = filtered.filter(o => new Date(o.created_at as string).getFullYear() === selectedYear);

  const groupByMonth = (rows: Record<string, unknown>[]) => {
    const groups: Record<string, { label: string; rows: Record<string, unknown>[]; key: string }> = {};
    const months = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
    months.forEach((m, idx) => {
      const key = `${selectedYear}-${String(idx + 1).padStart(2, "0")}`;
      groups[key] = { label: `${m} ${selectedYear}`, rows: [], key };
    });
    rows.forEach(o => {
      const d = new Date(o.created_at as string);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (groups[key]) groups[key].rows.push(o);
    });
    return Object.values(groups).filter(g => g.rows.length > 0).sort((a, b) => b.key.localeCompare(a.key));
  };

  const COLUMNS = [
    { key: "no",      label: "N°",             icon: null,                                   width: "w-10" },
    { key: "proyek",  label: "Nama Proyek",    icon: <FileText className="w-3 h-3" />,       width: "w-48" },
    { key: "klien",   label: "Nama Klien",     icon: <span>👤</span>,                        width: "w-40" },
    { key: "wa",      label: "WhatsApp Klien", icon: <Phone className="w-3 h-3" />,          width: "w-40" },
    { key: "layanan", label: "Layanan",        icon: <span>🛍️</span>,                       width: "w-52" },
    { key: "harga",   label: "Total Harga",    icon: <span>💰</span>,                        width: "w-32" },
    { key: "status",  label: "Status",         icon: <span>🕐</span>,                        width: "w-36" },
    { key: "aksi",    label: "Aksi",           icon: <span>⚙️</span>,                        width: "w-16" },
  ];

  function TableRow({ o, idx }: { o: Record<string, unknown>; idx: number }) {
    const id = o.id as string;
    const isSaving = saving[id];
    const serviceId = (o.service_id as string) || "";
    const pkgName = getPackageName(o);
    return (
      <tr className="group border-b border-slate-100/60 hover:bg-slate-50/70 transition-colors">
        <td className="px-3 py-2 text-slate-400 text-xs select-none w-10 text-center">{idx}</td>
        <td className="px-3 py-2">
          <div className="flex items-center gap-1.5">
            <FileText className="w-3 h-3 text-slate-300 shrink-0" />
            <InlineText value={getProjectTitle(o)} placeholder="Nama proyek..." onChange={v => { const fd = getFormData(o); updateFormField(id, o, { form_data: { ...fd, project_title: v, "Project Title": v } }); }} />
            {isSaving && <Loader2 className="w-3 h-3 animate-spin text-primary ml-1 shrink-0" />}
          </div>
        </td>
        <td className="px-3 py-2"><InlineText value={getClientName(o)} onChange={v => { const fd = getFormData(o); const extra: Record<string, unknown> = { form_data: { ...fd, customer_name: v, "Client Name": v } }; if (o.guest_name !== undefined) extra.guest_name = v; updateFormField(id, o, extra); }} /></td>
        <td className="px-3 py-2"><InlineText value={getClientWhatsApp(o)} placeholder="+62..." onChange={v => { const fd = getFormData(o); const extra: Record<string, unknown> = { form_data: { ...fd, whatsapp: v } }; if (o.guest_phone !== undefined) extra.guest_phone = v; updateFormField(id, o, extra); }} /></td>
        <td className="px-3 py-2"><InlineLayanan serviceId={serviceId} packageName={pkgName} services={servicesList} onChangeService={(newId: string) => { const newSvc = servicesList.find(s => s.id === newId); updateServiceAndPackage(id, newId, newSvc?.packages?.[0]?.name || "", o); }} onChangePackage={(newPkg: string) => updateServiceAndPackage(id, serviceId, newPkg, o)} /></td>
        <td className="px-3 py-2"><InlineNumber value={Number(o.total_amount || 0) + (allCharges[id as string] || 0)} onChange={v => updateField(id, "total_amount", Math.max(0, v - (allCharges[id as string] || 0)))} /></td>
        <td className="px-3 py-2"><InlineStatus value={(o.status as string) || "pending"} onChange={v => updateField(id, "status", v)} /></td>
        <td className="px-3 py-2 text-center">
           <button onClick={(e) => { e.stopPropagation(); openSlide(o); }} className="p-1.5 text-slate-400 hover:text-primary hover:bg-indigo-50 rounded-lg transition-colors inline-block" title="Lihat Detail">
             <Eye className="w-4 h-4" />
           </button>
        </td>
      </tr>
    );
  }

  function GroupedTable({ groups, footer }: { groups: any[]; footer?: React.ReactNode }) {
    return (
      <div className="flex flex-col flex-1 bg-white ring-1 ring-slate-100 rounded-2xl overflow-hidden shadow-sm mt-4">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left min-w-[960px]">
            <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-100">
              <tr>{COLUMNS.map(col => (<th key={col.key} className={`px-3 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap ${col.width}`}><span className="flex items-center gap-1.5">{col.icon}{col.label}</span></th>))}</tr>
            </thead>
            <tbody>
              {groups.map((group: any) => {
                const expanded = expandedGroups[group.key] ?? true;
                const groupTotal = group.rows.reduce((s: number, o: any) => s + Number(o.total_amount || 0) + (allCharges[o.id] || 0), 0);
                return (
                  <React.Fragment key={group.key}>
                    <tr className="bg-white hover:bg-slate-50/50 cursor-pointer transition-colors border-b border-slate-50" onClick={() => setExpandedGroups(e => ({...e, [group.key]: !expanded}))}>
                      <td colSpan={COLUMNS.length} className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          {expanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                          <span className="text-sm font-bold text-slate-800">{group.label}</span>
                          <span className="text-xs text-slate-400 font-medium ml-2 bg-slate-100 px-2 py-0.5 rounded-full">{group.rows.length} Data</span>
                          <span className="text-xs font-bold text-primary ml-auto pr-4">{IDR_FULL(groupTotal)}</span>
                        </div>
                      </td>
                    </tr>
                    {expanded && group.rows.map((o: any, i: number) => <TableRow key={o.id as string} o={o} idx={i + 1} />)}
                  </React.Fragment>
                );
              })}
              {groups.length === 0 && (
                <tr><td colSpan={COLUMNS.length} className="px-6 py-12 text-center text-slate-400 font-medium text-sm">Belum ada proyek yang ditemukan.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {footer}
      </div>
    );
  }

  const pagedGroups = (groups: any[]) => {
    let count = 0; const result = [];
    for (const g of groups) {
      const start = (page - 1) * PAGE_SIZE; const end = page * PAGE_SIZE;
      if (count >= end) break;
      const rowsInRange = g.rows.slice(Math.max(0, start - count), end - count);
      count += g.rows.length;
      if (rowsInRange.length > 0) result.push({ ...g, rows: rowsInRange });
    } return result;
  };

  return (
    <div className="flex flex-col min-h-screen pt-4 pb-16 px-4 sm:px-6">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Manajemen Proyek</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Kelola semua pesanan, klien, dan layanan di satu tempat.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { title: "Klien Teratas", value: stats.topClient.name, tag: `${stats.topClient.count} Pesanan • ${IDR(stats.topClient.amount)}`, icon: Users, color: "text-primary", bg: "bg-indigo-50" },
          { title: "Layanan Teratas", value: stats.topItem.name, tag: `${stats.topItem.count} Pesanan • ${IDR(stats.topItem.amount)}`, icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-50" },
          { title: "Pesanan Bulanan", value: `${stats.monthlyOrderCount} Pesanan`, tag: `${IDR(stats.monthlyOrderAmount)} Bulan ini`, icon: Calendar, color: "text-emerald-500", bg: "bg-emerald-50" },
          { title: "Total Pesanan", value: `${stats.totalOrderCount} Pesanan`, tag: `${IDR(stats.totalOrderAmount)} Keseluruhan`, icon: Wallet, color: "text-amber-500", bg: "bg-amber-50" },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 ring-1 ring-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all hover:shadow-md">
             <div className="flex items-center gap-3 mb-3 text-slate-500">
               <div className={`p-2 rounded-xl ${s.bg}`}><s.icon className={`w-4 h-4 ${s.color}`} /></div>
               <h3 className="text-sm font-bold truncate">{s.title}</h3>
             </div>
             <span className="text-xl font-bold text-slate-900 block mb-1.5 truncate">{s.value}</span>
             <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{s.tag}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-4 mt-2 mb-2">
         <div className="flex items-center gap-2">
            <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari pesanan..."
                 className="pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 w-full sm:w-64 shadow-sm font-medium" />
            </div>
            <button
               onClick={() => setShowAddModal(true)}
               className="inline-flex items-center gap-2 px-3 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-sm whitespace-nowrap"
            >
               <Plus className="w-4 h-4" /> Tambah Proyek
            </button>
            <button
               onClick={handleSyncAllToTickTick}
               disabled={syncingTickTick}
               className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
               title="Export semua pesanan aktif ke TickTick (tidak duplikat)"
            >
               {syncingTickTick ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
               Sync ke TickTick
            </button>
         </div>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <GroupedTable groups={groupByMonth(tableFiltered)} footer={<YearNavigator years={allYears.length > 0 ? allYears : [CURRENT_YEAR]} selectedYear={selectedYear} onSelect={y => { setSelectedYear(y); setExpandedGroups({}); }} />} />
      )}

      {/* Detail Right Slide Modal */}
      {mounted && isSlideOpen && selectedProject && createPortal((
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity" onClick={() => setIsSlideOpen(false)} />
          <div className="w-full max-w-md bg-white h-full shadow-2xl relative z-10 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
             <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                   <h2 className="text-base font-bold text-slate-900">
                     {modalView === 'detail' && "Detail Proyek"}
                     {modalView === 'email' && "Kirim File Akhir"}
                     {modalView === 'edit' && "Edit Proyek"}
                   </h2>
                   <p className="text-[10px] font-mono text-slate-400 mt-0.5">#{selectedProject.order_number}</p>
                </div>
                <button onClick={() => setIsSlideOpen(false)} className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors">
                  <X className="w-4 h-4" />
                </button>
             </div>

             <div className="p-6 flex-1 overflow-y-auto bg-white">
                {modalView === "detail" && (
                   <div className="space-y-6">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Informasi Utama</p>
                        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-3">
                           <div className="border-b border-slate-200/60 pb-3">
                              <p className="text-xs text-slate-500 font-medium mb-0.5">Judul Proyek</p>
                              <InlineText
                                value={getProjectTitle(selectedProject)}
                                placeholder="Ketik judul proyek..."
                                onChange={v => {
                                  const fd = getFormData(selectedProject);
                                  updateFormField(selectedProject.id, selectedProject, { form_data: { ...fd, project_title: v, "Project Title": v } });
                                  setSelectedProject((p: any) => ({ ...p, form_data: { ...fd, project_title: v, "Project Title": v } }));
                                }}
                              />
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs text-slate-500 font-medium mb-1">Layanan</p>
                                <InlineLayanan
                                  serviceId={(selectedProject.service_id as string) || ""}
                                  packageName={getPackageName(selectedProject)}
                                  services={servicesList}
                                  onChangeService={(newId: string) => {
                                    const newSvc = servicesList.find(s => s.id === newId);
                                    updateServiceAndPackage(selectedProject.id, newId, newSvc?.packages?.[0]?.name || "", selectedProject);
                                    setSelectedProject((p: any) => ({ ...p, service_id: newId }));
                                  }}
                                  onChangePackage={(newPkg: string) => {
                                    updateServiceAndPackage(selectedProject.id, (selectedProject.service_id as string) || "", newPkg, selectedProject);
                                  }}
                                />
                              </div>
                              <div>
                                <p className="text-xs text-slate-500 font-medium mb-0.5">Paket</p>
                                <p className="text-sm font-semibold text-indigo-600">{getPackageName(selectedProject) || "—"}</p>
                              </div>
                           </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Klien</p>
                        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center gap-4">
                           <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-primary font-bold">
                             {getClientName(selectedProject).charAt(0).toUpperCase()}
                           </div>
                           <div className="min-w-0 flex-1">
                             <p className="text-sm font-bold text-slate-900 truncate">{getClientName(selectedProject)}</p>
                             <p className="text-xs text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                               <Phone className="w-3 h-3" /> {getClientWhatsApp(selectedProject)}
                             </p>
                           </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                         <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Status</p>
                            <span className={`inline-block px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border ${STATUS_CONFIG[selectedProject.status]?.bg ? '' : 'bg-slate-100 text-slate-500'}`} style={{ backgroundColor: STATUS_CONFIG[selectedProject.status]?.bg, color: STATUS_CONFIG[selectedProject.status]?.color, borderColor: STATUS_CONFIG[selectedProject.status]?.color + '40' }}>
                              {STATUS_CONFIG[selectedProject.status]?.label || selectedProject.status}
                            </span>
                         </div>
                         <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Total</p>
                            <p className="text-sm font-bold text-slate-900">{IDR_FULL(Number(selectedProject.total_amount || 0) + (allCharges[selectedProject.id] || 0))}</p>
                         </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Biaya Tambahan</p>
                        <div className="space-y-2">
                           {(allChargeItems[selectedProject.id] || []).map((c: any) => (
                             <div key={c.id} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl p-3">
                               <div>
                                 <p className="text-xs font-bold text-slate-700">{c.description}</p>
                                 <p className="text-[11px] font-medium text-slate-500">{IDR_FULL(c.amount)}</p>
                               </div>
                               <button onClick={() => handleDeleteCharge(c.id)} className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                                 <Trash2 className="w-3.5 h-3.5" />
                               </button>
                             </div>
                           ))}
                           <div className="flex items-center gap-2 mt-2">
                              <input type="text" placeholder="Keterangan..." value={newChargeDesc} onChange={e => setNewChargeDesc(e.target.value)} className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20" />
                              <input type="number" placeholder="Nominal" value={newChargeAmount} onChange={e => setNewChargeAmount(e.target.value)} className="w-28 px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20" />
                              <button onClick={handleAddCharge} disabled={isAddingCharge} className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl transition-colors disabled:opacity-50" title="Tambah">
                                {isAddingCharge ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                              </button>
                           </div>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-100">
                         {selectedProject.status === "completed" && (
                         <button onClick={() => { setEmailNotification(null); setModalView("email"); }} className="w-full flex items-center justify-between p-3 rounded-xl bg-[#a698ff]/10 text-[#715cff] hover:bg-[#a698ff]/20 transition-colors border border-[#a698ff]/20">
                           <span className="flex items-center gap-2 text-sm font-bold"><Mail className="w-4 h-4" /> Kirim File Akhir</span>
                           <ChevronRight className="w-4 h-4 opacity-50" />
                         </button>
                         )}
                         <Link href={`/workspace/${selectedProject.id}`} className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors border border-slate-200">
                           <span className="flex items-center gap-2 text-sm font-bold"><MessageSquare className="w-4 h-4 text-slate-400" /> Buka Ruang Kerja</span>
                           <ExternalLink className="w-3.5 h-3.5 opacity-50" />
                         </Link>
                         <button onClick={() => generateTestimonial(selectedProject.id)} className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors border border-slate-200">
                            <span className="flex items-center gap-2 text-sm font-bold"><Star className="w-4 h-4 text-amber-400" /> Salin Link Testimoni</span>
                            <Copy className="w-3.5 h-3.5 opacity-50" />
                          </button>
                         <div className="grid grid-cols-2 gap-2 mt-2">
                           <button onClick={() => openSlide(selectedProject, "edit")} className="w-full flex justify-center items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-colors">
                              <Edit3 className="w-3.5 h-3.5" /> Edit
                           </button>
                           <button onClick={() => deleteProject(selectedProject.id)} className="w-full flex justify-center items-center gap-2 p-2.5 rounded-xl bg-white border border-rose-100 hover:bg-rose-50 text-rose-500 text-xs font-bold transition-colors">
                              <Trash2 className="w-3.5 h-3.5" /> Hapus
                           </button>
                         </div>
                      </div>
                   </div>
                )}

                {modalView === "email" && (
                   <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                      <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl flex items-start gap-3 mb-2">
                        <Mail className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-indigo-900 mb-0.5">Kirim ke: {getClientName(selectedProject)}</p>
                          <p className="text-[11px] text-indigo-700/80 font-medium break-all">{getClientEmail(selectedProject) || <span className="text-rose-500">Email tidak ditemukan!</span>}</p>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                         <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Kirim Dari Domain</label>
                         <div className="relative">
                            <select value={sendFromId} onChange={e => setSendFromId(e.target.value)} className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold outline-none appearance-none focus:ring-2 focus:ring-[#715cff]/30 focus:border-[#715cff]">
                              <option value="">— Gunakan domain default —</option>
                              {domains.map(d => <option key={d.id} value={d.id}>{d.display_name} ({d.domain})</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                         </div>
                      </div>

                      <div className="space-y-1.5">
                         <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Template</label>
                         <div className="relative">
                            <select value={sendTemplateId} onChange={e => setSendTemplateId(e.target.value)} className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold outline-none appearance-none focus:ring-2 focus:ring-[#715cff]/30 focus:border-[#715cff]">
                              <option value="">— Pilih template —</option>
                              {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                         </div>
                      </div>

                      <div className="space-y-1.5 pt-2">
                         <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Lampiran (ZIP/RAR saja)</label>
                         <div className="flex items-center gap-3">
                            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-bold transition-all">
                               <Paperclip className="w-4 h-4" /> Pilih File
                               <input type="file" className="hidden" accept=".zip,.rar" onChange={e => { setSendAttachment(e.target.files?.[0] || null); setUploadProgress(100); }} />
                            </label>
                            {sendAttachment && (
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-medium text-slate-600 truncate">{sendAttachment.name}</span>
                                  <span className="text-[9px] font-bold text-slate-400">{uploadProgress}%</span>
                                </div>
                                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                                </div>
                              </div>
                            )}
                         </div>
                      </div>

                      {emailNotification && (
                        <div className={`p-3 rounded-xl border flex items-start gap-2 ${
                          emailNotification.type === "success" 
                            ? "bg-green-50 border-green-200" 
                            : "bg-red-50 border-red-200"
                        }`}>
                          {emailNotification.type === "success" ? (
                            <Check className="w-4 h-4 shrink-0 mt-0.5 text-green-600" />
                          ) : (
                            <X className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                          )}
                          <p className={`text-xs font-medium ${emailNotification.type === "success" ? "text-green-700" : "text-red-700"}`}>
                            {emailNotification.message}
                          </p>
                        </div>
                      )}

                      <div className="pt-6 flex items-center gap-3 border-t border-slate-100 mt-6">
                         <button onClick={() => setModalView("detail")} className="flex-1 py-3 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 font-bold text-sm transition-colors">Batal</button>
                         <button onClick={handleSendEmail} disabled={sendingEmail || !getClientEmail(selectedProject)} className="flex-1 py-3 bg-[#a698ff] hover:bg-[#8f7fff] disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm">
                           {sendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Kirim File Akhir
                         </button>
                      </div>
                   </div>
                )}
                
                {modalView === "edit" && (
                   <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">Judul Proyek</label>
                          <input type="text" value={editFormData.project_title} onChange={e => setEditFormData({...editFormData, project_title: e.target.value})} className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">Nama Klien</label>
                          <input type="text" value={editFormData.customer_name} onChange={e => setEditFormData({...editFormData, customer_name: e.target.value})} className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">WhatsApp</label>
                          <input type="text" value={editFormData.whatsapp} onChange={e => setEditFormData({...editFormData, whatsapp: e.target.value})} className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">Email Klien</label>
                          <input type="email" value={editFormData.customer_email} onChange={e => setEditFormData({...editFormData, customer_email: e.target.value})} className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">Status</label>
                          <div className="relative">
                            <select value={editFormData.status} onChange={e => setEditFormData({...editFormData, status: e.target.value})} className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none">
                              <option value="pending">Menunggu</option>
                              <option value="waiting_payment">Belum Dibayar</option>
                              <option value="paid">Dibayar</option>
                              <option value="processing">Dikerjakan</option>
                              <option value="completed">Selesai</option>
                              <option value="cancelled">Dibatalkan</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">Progress (%)</label>
                          <input type="number" min="0" max="100" value={editFormData.progress} onChange={e => setEditFormData({...editFormData, progress: parseInt(e.target.value) || 0})} className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">Total Harga Base (Rp)</label>
                          <input type="number" value={editFormData.total_amount} onChange={e => setEditFormData({...editFormData, total_amount: e.target.value})} className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">Diskon (Rp)</label>
                          <input type="number" value={editFormData.discount_amount} onChange={e => setEditFormData({...editFormData, discount_amount: e.target.value})} className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">Metode Pembayaran</label>
                          <input type="text" placeholder="Transfer Bank, E-Wallet, dll..." value={editFormData.payment_method} onChange={e => setEditFormData({...editFormData, payment_method: e.target.value})} className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20" />
                        </div>
                      </div>
                      <div className="pt-4 flex items-center gap-3 border-t border-slate-100">
                         <button onClick={() => setModalView("detail")} className="flex-1 py-3 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 font-bold text-sm transition-colors">Batal</button>
                         <button onClick={handleSaveEdit} className="flex-1 py-3 bg-primary hover:bg-secondary text-white rounded-xl text-sm font-bold flex items-center justify-center transition-colors">
                           Simpan
                         </button>
                      </div>
                   </div>
                )}
             </div>
          </div>
        </div>
      ), document.body)}

      {mounted && showAddModal && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-slate-900">Tambah Proyek Custom</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">Judul Proyek *</label>
                <input type="text" value={addForm.project_title} onChange={e => setAddForm({...addForm, project_title: e.target.value})} placeholder="Nama proyek..." className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">Layanan *</label>
                  <div className="relative">
                    <select value={addForm.service_id} onChange={e => setAddForm({...addForm, service_id: e.target.value, package_name: ""})} className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 appearance-none">
                      <option value="">— Pilih Layanan —</option>
                      {servicesList.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">Paket *</label>
                  <div className="relative">
                    <select value={addForm.package_name} onChange={e => setAddForm({...addForm, package_name: e.target.value})} className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 appearance-none" disabled={!addForm.service_id}>
                      <option value="">— Pilih Paket —</option>
                      {(servicesList.find(s => s.id === addForm.service_id)?.packages || []).map((p: { name: string }) => <option key={p.name} value={p.name}>{p.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">Nama Klien</label>
                  <input type="text" value={addForm.customer_name} onChange={e => setAddForm({...addForm, customer_name: e.target.value})} placeholder="Nama klien..." className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">WhatsApp</label>
                  <input type="text" value={addForm.whatsapp} onChange={e => setAddForm({...addForm, whatsapp: e.target.value})} placeholder="+62..." className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">Email Klien</label>
                <input type="email" value={addForm.customer_email} onChange={e => setAddForm({...addForm, customer_email: e.target.value})} placeholder="email@klien.com" className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Harga (Rp)</label>
                    {addForm.service_id && addForm.package_name && <span className="text-[9px] px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded font-bold">Auto</span>}
                  </div>
                  <input type="number" value={addForm.total_amount} onChange={e => setAddForm({...addForm, total_amount: e.target.value})} placeholder="0" className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20" />
                  {addForm.service_id && addForm.package_name && <p className="text-[10px] text-slate-400 mt-1">Auto diisi dari harga paket</p>}
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">Status</label>
                  <div className="relative">
                    <select value={addForm.status} onChange={e => setAddForm({...addForm, status: e.target.value})} className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 appearance-none">
                      <option value="pending">No Status</option>
                      <option value="waiting_payment">Belum Dibayar</option>
                      <option value="paid">Dibayar</option>
                      <option value="processing">Dikerjakan</option>
                      <option value="completed">Selesai</option>
                      <option value="cancelled">Dibatalkan</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-5 pt-4 border-t border-slate-100">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 font-bold text-sm transition-colors">Batal</button>
              <button onClick={handleAddCustomProject} disabled={addSaving} className="flex-1 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
                {addSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Simpan Proyek
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}