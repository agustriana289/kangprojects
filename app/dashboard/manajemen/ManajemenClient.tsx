"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  BarChart3, LayoutGrid, Tag, Search, ChevronDown,
  ChevronRight, ChevronLeft, Loader2, Check, FileText, Phone, Users, Briefcase
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ToastProvider";

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
const IDR_FULL = (n: number) => `IDR ${Number(n || 0).toLocaleString("id-ID")}`;
const IDR = (n: number) =>
  n >= 1_000_000 ? `IDR ${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`
  : n >= 1_000 ? `IDR ${Math.round(n / 1_000)}K`
  : `IDR ${n.toLocaleString("id-ID")}`;

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
    <div onClick={() => setEditing(true)} className="text-sm text-slate-700 hover:bg-slate-50 px-2 py-0.5 rounded cursor-text min-h-[26px] transition-colors">
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
    <div onClick={() => setEditing(true)} className="text-sm text-slate-700 hover:bg-slate-50 px-2 py-0.5 rounded cursor-text min-h-[26px] transition-colors">
      {value > 0 ? IDR_FULL(value) : <span className="text-slate-300 italic">—</span>}
    </div>
  );
}

function InlineStatus({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
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

function InlineLayanan({
  serviceId, packageName, services, onChangeService, onChangePackage,
}: {
  serviceId: string; packageName: string;
  services: { id: string; title: string; packages: { name: string }[] }[];
  onChangeService: (id: string) => void; onChangePackage: (pkg: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const currentService = services.find(s => s.id === serviceId);
  const packages = currentService?.packages || [];
  const display = currentService
    ? `${currentService.title}${packageName && packageName !== "—" ? ` - ${packageName}` : ""}`
    : (packageName && packageName !== "—" ? packageName : "—");
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen(o => !o)} className="text-sm text-slate-700 hover:bg-slate-50 px-2 py-0.5 rounded cursor-pointer min-h-[26px] transition-colors">
        {display || <span className="text-slate-300 italic">—</span>}
      </div>
      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 bg-white shadow-xl border border-slate-200 rounded-xl overflow-hidden min-w-[240px]">
          <div className="px-3 py-2 border-b border-slate-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Layanan</p>
            <div className="space-y-0.5 max-h-40 overflow-y-auto">
              {services.map(svc => (
                <button key={svc.id} onClick={() => { onChangeService(svc.id); }} className="flex items-center gap-2 w-full px-2 py-1.5 hover:bg-slate-50 text-left rounded transition-colors">
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
                {packages.map(pkg => (
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

function BarChartView({ orders }: { orders: Record<string, unknown>[] }) {
  type MonthBucket = { label: string; total: number; byStatus: Record<string, number> };
  const buckets: Record<string, MonthBucket> = {};
  orders.forEach(o => {
    const d = new Date(o.created_at as string);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const monthLabel = d.toLocaleDateString("id-ID", { month: "short", year: "numeric" });
    if (!buckets[key]) buckets[key] = { label: monthLabel, total: 0, byStatus: {} };
    const amt = Number(o.total_amount || 0);
    buckets[key].total += amt;
    const st = o.status as string;
    buckets[key].byStatus[st] = (buckets[key].byStatus[st] || 0) + amt;
  });
  const sorted = Object.entries(buckets).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
  const maxVal = Math.max(...sorted.map(b => b.total), 1);
  const statusColors: Record<string, string> = {
    pending: "#d4d4d4", waiting_payment: "#fbbf24", cancelled: "#f87171",
    paid: "#60a5fa", processing: "#a78bfa", completed: "#34d399",
  };
  return (
    <div className="flex-1 px-8 pt-8 pb-6 overflow-auto">
      <div className="flex items-end gap-8 min-w-0" style={{ height: 320 }}>
        {sorted.map((bucket, i) => {
          const BAR_H = 280;
          const barPx = Math.max(Math.round((bucket.total / maxVal) * BAR_H), 6);
          return (
            <div key={i} className="flex flex-col items-center gap-2 flex-1 min-w-[80px]">
              <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap">{IDR(bucket.total)}</span>
              <div
                className="w-full rounded-t-md overflow-hidden flex flex-col-reverse"
                style={{ height: barPx }}
              >
                {ALL_STATUSES.map(st => {
                  const amt = bucket.byStatus[st] || 0;
                  if (!amt) return null;
                  const segH = Math.max(Math.round((amt / bucket.total) * barPx), 2);
                  return (
                    <div
                      key={st}
                      title={`${STATUS_CONFIG[st]?.label}: ${IDR_FULL(amt)}`}
                      style={{ height: segH, background: statusColors[st] || "#d4d4d4", flexShrink: 0 }}
                    />
                  );
                })}
              </div>
              <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap">{bucket.label}</span>
            </div>
          );
        })}
        {sorted.length === 0 && <div className="flex-1 flex items-center justify-center text-slate-300 text-sm">Belum ada data</div>}
      </div>
      <div className="flex flex-wrap items-center gap-4 mt-6 justify-center">
        {ALL_STATUSES.map(st => (
          <div key={st} className="flex items-center gap-1.5">
            <span style={{ background: statusColors[st] }} className="w-3 h-3 rounded-sm" />
            <span className="text-[11px] text-slate-500 font-medium">{STATUS_CONFIG[st]?.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
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

function Pagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p: number) => void }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1);
  const withEllipsis: (number | "...")[] = [];
  pages.forEach((p, i) => {
    if (i > 0 && (p as number) - (pages[i - 1] as number) > 1) withEllipsis.push("...");
    withEllipsis.push(p);
  });
  return (
    <div className="border-t border-slate-100 px-6 py-3 flex items-center gap-1.5">
      <button onClick={() => onPage(page - 1)} disabled={page === 1} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 disabled:opacity-30 transition-colors">
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>
      {withEllipsis.map((p, i) =>
        p === "..." ? (
          <span key={`e-${i}`} className="px-2 text-slate-300 text-sm">…</span>
        ) : (
          <button key={p} onClick={() => onPage(p as number)}
            className={`px-3 py-1 rounded-lg text-sm font-semibold transition-all ${page === p ? "bg-primary text-white shadow-sm" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}>
            {p}
          </button>
        )
      )}
      <button onClick={() => onPage(page + 1)} disabled={page === totalPages} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 disabled:opacity-30 transition-colors">
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function ManajemenClient() {
  const supabase = createClient();
  const { showToast } = useToast();

  const [orders, setOrders] = useState<Record<string, unknown>[]>([]);
  const [servicesList, setServicesList] = useState<{ id: string; title: string; packages: { name: string }[] }[]>([]);
  const [allCharges, setAllCharges] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("table");
  const [search, setSearch] = useState("");
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(1);

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

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data: profiles } = await supabase.from("users").select("id, full_name, email");
      const profileMap: Record<string, Record<string, unknown>> = {};
      (profiles || []).forEach((p: Record<string, unknown>) => { if (p.id) profileMap[p.id as string] = p; });
      const [{ data, error }, { data: svcs }] = await Promise.all([
        supabase.from("store_orders").select("*, store_products(title, category), store_services(title, category)").order("created_at", { ascending: false }),
        supabase.from("store_services").select("id, title, packages").order("sort_order", { ascending: true }),
      ]);
      if (error) throw error;
      const mapped = (data || []).map(o => ({ ...o, client: profileMap[o.user_id as string] || null }));
      setOrders(mapped);
      setServicesList(svcs || []);

      if (mapped.length > 0) {
        const ids = mapped.map(o => o.id as string);
        const { data: charges } = await supabase
          .from("order_additional_charges")
          .select("order_id, amount")
          .in("order_id", ids);
        const chargeMap: Record<string, number> = {};
        (charges || []).forEach((c: { order_id: string; amount: number }) => {
          chargeMap[c.order_id] = (chargeMap[c.order_id] || 0) + Number(c.amount || 0);
        });
        setAllCharges(chargeMap);
      }
    } catch (err: unknown) {
      showToast((err as Error).message || "Gagal memuat data", "error");
    } finally {
      setLoading(false);
    }
  }, [supabase, showToast]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => { setPage(1); }, [view, search, selectedYear]);

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


  const filtered = orders.filter(o => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      getProjectTitle(o).toLowerCase().includes(q) ||
      getClientName(o).toLowerCase().includes(q) ||
      getServiceTitle(o).toLowerCase().includes(q) ||
      getPackageName(o).toLowerCase().includes(q)
    );
  });

  const allYears = Array.from(new Set(orders.map(o => new Date(o.created_at as string).getFullYear())))
    .sort((a, b) => a - b);

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
    return Object.values(groups)
      .filter(g => g.rows.length > 0)
      .sort((a, b) => b.key.localeCompare(a.key));
  };

  const groupByStatus = (rows: Record<string, unknown>[]) => {
    const groups: Record<string, { label: string; rows: Record<string, unknown>[]; key: string; cfg: typeof STATUS_CONFIG[string] }> = {};
    ALL_STATUSES.forEach(st => { groups[st] = { label: STATUS_CONFIG[st].label, rows: [], key: st, cfg: STATUS_CONFIG[st] }; });
    rows.forEach(o => {
      const st = (o.status as string) || "pending";
      if (!groups[st]) groups[st] = { label: STATUS_CONFIG[st]?.label || st, rows: [], key: st, cfg: STATUS_CONFIG[st] };
      groups[st].rows.push(o);
    });
    return Object.values(groups).filter(g => g.rows.length > 0);
  };

  const groupByLayanan = (rows: Record<string, unknown>[]) => {
    const groups: Record<string, { label: string; rows: Record<string, unknown>[]; key: string }> = {};
    rows.forEach(o => {
      const svc = getServiceTitle(o) || "Layanan Lainnya";
      if (!groups[svc]) groups[svc] = { label: svc, rows: [], key: svc };
      groups[svc].rows.push(o);
    });
    return Object.values(groups).sort((a, b) => a.label.localeCompare(b.label));
  };

  const groupByKlien = (rows: Record<string, unknown>[]) => {
    const groups: Record<string, { label: string; rows: Record<string, unknown>[]; key: string }> = {};
    rows.forEach(o => {
      const name = getClientName(o) || "Klien Tidak Dikenal";
      if (!groups[name]) groups[name] = { label: name, rows: [], key: name };
      groups[name].rows.push(o);
    });
    return Object.values(groups).sort((a, b) => a.label.localeCompare(b.label));
  };

  const toggleGroup = (key: string) => setExpandedGroups(eg => ({ ...eg, [key]: !(eg[key] ?? true) }));
  const isExpanded = (key: string) => expandedGroups[key] ?? true;

  const COLUMNS = [
    { key: "no",      label: "N°",             icon: null,                                   width: "w-10" },
    { key: "proyek",  label: "Nama Proyek",    icon: <FileText className="w-3 h-3" />,       width: "w-48" },
    { key: "klien",   label: "Nama Klien",     icon: <span>👤</span>,                        width: "w-40" },
    { key: "wa",      label: "WhatsApp Klien", icon: <Phone className="w-3 h-3" />,          width: "w-40" },
    { key: "layanan", label: "Layanan",        icon: <span>🛍️</span>,                       width: "w-52" },
    { key: "harga",   label: "Total Harga",    icon: <span>💰</span>,                        width: "w-36" },
    { key: "diskon",  label: "Diskon",         icon: <span>🏷️</span>,                       width: "w-36" },
    { key: "status",  label: "Status",         icon: <span>🕐</span>,                        width: "w-36" },
  ];

  function TableRow({ o, idx }: { o: Record<string, unknown>; idx: number }) {
    const id = o.id as string;
    const isSaving = saving[id];
    const serviceId = (o.service_id as string) || "";
    const pkgName = getPackageName(o);
    return (
      <tr className="group border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
        <td className="px-3 py-2 text-slate-400 text-xs select-none w-10 text-center">{idx}</td>
          <td className="px-3 py-2">
            <div className="flex items-center gap-1.5">
              <FileText className="w-3 h-3 text-slate-300 shrink-0" />
              <InlineText value={getProjectTitle(o)} placeholder="Nama proyek..."
                onChange={v => {
                  const fd = getFormData(o);
                  updateFormField(id, o, { form_data: { ...fd, project_title: v, "Project Title": v } });
                }} />
              {isSaving && <Loader2 className="w-3 h-3 animate-spin text-primary ml-1 shrink-0" />}
            </div>
          </td>
          <td className="px-3 py-2">
            <InlineText value={getClientName(o)}
              onChange={v => {
                const fd = getFormData(o);
                const extra: Record<string, unknown> = { form_data: { ...fd, customer_name: v, "Client Name": v } };
                if (o.guest_name !== undefined) extra.guest_name = v;
                updateFormField(id, o, extra);
              }} />
          </td>
          <td className="px-3 py-2">
            <InlineText value={getClientWhatsApp(o)} placeholder="+62..."
              onChange={v => {
                const fd = getFormData(o);
                const extra: Record<string, unknown> = { form_data: { ...fd, whatsapp: v } };
                if (o.guest_phone !== undefined) extra.guest_phone = v;
                updateFormField(id, o, extra);
              }} />
          </td>
          <td className="px-3 py-2">
            <InlineLayanan serviceId={serviceId} packageName={pkgName} services={servicesList}
              onChangeService={newId => {
                const newSvc = servicesList.find(s => s.id === newId);
                updateServiceAndPackage(id, newId, newSvc?.packages?.[0]?.name || "", o);
              }}
              onChangePackage={newPkg => updateServiceAndPackage(id, serviceId, newPkg, o)} />
          </td>
          <td className="px-3 py-2">
            <InlineNumber value={Number(o.total_amount || 0)} onChange={v => updateField(id, "total_amount", v)} />
          </td>
          <td className="px-3 py-2">
            <InlineNumber value={Number(o.discount_amount || 0)} onChange={v => updateField(id, "discount_amount", v)} />
          </td>
      <td className="px-3 py-2">
            <InlineStatus value={(o.status as string) || "pending"} onChange={v => updateField(id, "status", v)} />
          </td>
        </tr>
    );
  }

  function GroupedTable({
    groups, footer,
  }: {
    groups: { label: string; rows: Record<string, unknown>[]; key: string; cfg?: typeof STATUS_CONFIG[string] }[];
    footer?: React.ReactNode;
  }) {
    return (
      <div className="flex flex-col flex-1">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left min-w-[960px]">
            <thead className="sticky top-0 z-10 bg-white border-b border-slate-200">
              <tr>
                {COLUMNS.map(col => (
                  <th key={col.key} className={`px-3 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap ${col.width}`}>
                    <span className="flex items-center gap-1">{col.icon}{col.label}</span>
                  </th>
                ))}
                <th className="px-3 py-2.5 w-8" />
              </tr>
            </thead>
            <tbody>
              {groups.map(group => {
                const expanded = isExpanded(group.key);
                const groupTotal = group.rows.reduce((s, o) => s + Number(o.total_amount || 0), 0);
                const badgeStyle = group.cfg
                  ? { background: group.cfg.bg, color: group.cfg.color, border: `1px solid ${group.cfg.color}44` }
                  : {};
                return (
                  <React.Fragment key={group.key}>
                    <tr className="bg-slate-50/80 cursor-pointer hover:bg-slate-100/80 transition-colors" onClick={() => toggleGroup(group.key)}>
                      <td colSpan={COLUMNS.length + 1} className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          {expanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                          {group.cfg ? (
                            <span style={badgeStyle} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold">
                              <span style={{ background: group.cfg.dot }} className="w-1.5 h-1.5 rounded-full" />
                              {group.label}
                            </span>
                          ) : (
                            <span className="text-sm font-semibold text-slate-700">{group.label}</span>
                          )}
                          <span className="text-xs text-slate-400 font-medium ml-1">{group.rows.length} entri</span>
                        </div>
                      </td>
                    </tr>
                    {expanded && group.rows.map((o, i) => <TableRow key={o.id as string} o={o} idx={i + 1} />)}
                    {expanded && (() => {
                      const extraTotal = group.rows.reduce((s, o) => s + (allCharges[o.id as string] || 0), 0);
                      const grandTotal = groupTotal + extraTotal;
                      return (
                        <tr className="border-b border-slate-100 bg-slate-50/30">
                          <td colSpan={5} />
                          <td className="px-3 py-2">
                            <span className="text-xs font-bold text-slate-700">{IDR_FULL(grandTotal)}</span>
                          </td>
                          <td colSpan={3} />
                        </tr>
                      );
                    })()}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        {footer}
      </div>
    );
  }

  const pagedGroups = <T extends { rows: Record<string, unknown>[] }>(groups: T[]): T[] => {
    let count = 0;
    const result: T[] = [];
    for (const g of groups) {
      const start = (page - 1) * PAGE_SIZE;
      const end = page * PAGE_SIZE;
      if (count >= end) break;
      const rowsInRange = g.rows.slice(Math.max(0, start - count), end - count);
      count += g.rows.length;
      if (rowsInRange.length > 0) result.push({ ...g, rows: rowsInRange });
    }
    return result;
  };

  const totalFiltered = (groups: { rows: unknown[] }[]) => groups.reduce((s, g) => s + g.rows.length, 0);

  const viewTabs: { key: ViewMode; label: string; icon: React.ReactNode }[] = [
    { key: "table",   label: "Tabel",   icon: <LayoutGrid className="w-3.5 h-3.5" /> },
    { key: "status",  label: "Status",  icon: <Tag className="w-3.5 h-3.5" /> },
    { key: "layanan", label: "Layanan", icon: <Briefcase className="w-3.5 h-3.5" /> },
    { key: "klien",   label: "Klien",   icon: <Users className="w-3.5 h-3.5" /> },
    { key: "grafik",  label: "Grafik",  icon: <BarChart3 className="w-3.5 h-3.5" /> },
  ];

  const statusGroups = groupByStatus(filtered);
  const layananGroups = groupByLayanan(filtered);
  const klienGroups = groupByKlien(filtered);

  return (
    <div className="flex flex-col h-full min-h-screen bg-white">
      <div className="px-8 pt-8 pb-4 border-b border-slate-100">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-4">Proyek Saya</h1>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1">
            {viewTabs.map(tab => (
              <button key={tab.key} onClick={() => setView(tab.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  view === tab.key ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}>
                {tab.icon}{tab.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari..."
              className="pl-8 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-md outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 w-48" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {view === "table" && (
            <GroupedTable
              groups={groupByMonth(tableFiltered)}
              footer={
                <YearNavigator
                  years={allYears.length > 0 ? allYears : [CURRENT_YEAR]}
                  selectedYear={selectedYear}
                  onSelect={y => { setSelectedYear(y); setExpandedGroups({}); }}
                />
              }
            />
          )}

          {view === "status" && (
            <GroupedTable
              groups={pagedGroups(statusGroups)}
              footer={
                <Pagination page={page} totalPages={Math.ceil(totalFiltered(statusGroups) / PAGE_SIZE)} onPage={setPage} />
              }
            />
          )}

          {view === "layanan" && (
            <GroupedTable
              groups={pagedGroups(layananGroups)}
              footer={
                <Pagination page={page} totalPages={Math.ceil(totalFiltered(layananGroups) / PAGE_SIZE)} onPage={setPage} />
              }
            />
          )}

          {view === "klien" && (
            <GroupedTable
              groups={pagedGroups(klienGroups)}
              footer={
                <Pagination page={page} totalPages={Math.ceil(totalFiltered(klienGroups) / PAGE_SIZE)} onPage={setPage} />
              }
            />
          )}

          {view === "grafik" && <BarChartView orders={filtered} />}
        </>
      )}
    </div>
  );
}
