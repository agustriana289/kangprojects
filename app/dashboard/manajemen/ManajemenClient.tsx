"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  BarChart3, LayoutGrid, Tag, Filter, ArrowUpDown,
  Zap, Search, SlidersHorizontal, Plus, ChevronDown,
  ChevronRight, Loader2, Check, FileText,
  Phone
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ToastProvider";

type ViewMode = "chart" | "table" | "status";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  pending:         { label: "No Status",       color: "#9b9b9b", bg: "#f5f5f4", dot: "#9b9b9b" },
  waiting_payment: { label: "Belum Dibayar",   color: "#b45309", bg: "#fffbeb", dot: "#f59e0b" },
  cancelled:       { label: "Dibatalkan",      color: "#dc2626", bg: "#fef2f2", dot: "#ef4444" },
  paid:            { label: "Dibayar",         color: "#1d4ed8", bg: "#eff6ff", dot: "#3b82f6" },
  processing:      { label: "Dikerjakan",      color: "#7c3aed", bg: "#f5f3ff", dot: "#8b5cf6" },
  completed:       { label: "Selesai",         color: "#047857", bg: "#ecfdf5", dot: "#10b981" },
};

const ALL_STATUSES = Object.keys(STATUS_CONFIG);

const IDR = (n: number) =>
  n >= 1_000_000
    ? `IDR ${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`
    : n >= 1_000
    ? `IDR ${Math.round(n / 1_000)}K`
    : `IDR ${n.toLocaleString("id-ID")}`;

const IDR_FULL = (n: number) => `IDR ${Number(n || 0).toLocaleString("id-ID")}`;

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

function InlineCell({
  value,
  onChange,
  type = "text",
  options,
}: {
  value: string | number;
  onChange: (v: string) => void;
  type?: "text" | "number" | "select" | "status";
  options?: string[];
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const ref = useRef<HTMLInputElement | HTMLSelectElement>(null);

  useEffect(() => { setDraft(String(value)); }, [value]);

  const commit = () => {
    setEditing(false);
    if (draft !== String(value)) onChange(draft);
  };

  if (type === "status" || type === "select") {
    const opts = type === "status" ? ALL_STATUSES : (options || []);
    return (
      <div className="relative">
        {type === "status" ? (
          <StatusBadge status={draft} onClick={() => setEditing(e => !e)} />
        ) : (
          <button
            onClick={() => setEditing(e => !e)}
            className="text-sm text-slate-700 hover:bg-slate-100 px-2 py-1 rounded transition-colors text-left w-full"
          >
            {draft || <span className="text-slate-300 italic">—</span>}
          </button>
        )}
        {editing && (
          <div className="absolute z-50 top-full left-0 mt-1 bg-white shadow-xl border border-slate-200 rounded-xl overflow-hidden min-w-[160px]">
            {opts.map(opt => {
              const cfg = type === "status" ? STATUS_CONFIG[opt] : null;
              return (
                <button
                  key={opt}
                  onClick={() => { setDraft(opt); setEditing(false); onChange(opt); }}
                  className="flex items-center gap-2 w-full px-3 py-2 hover:bg-slate-50 text-left transition-colors"
                >
                  {cfg && <span style={{ background: cfg.dot }} className="w-2 h-2 rounded-full shrink-0" />}
                  <span
                    style={cfg ? { color: cfg.color } : {}}
                    className="text-sm font-medium"
                  >
                    {cfg ? cfg.label : opt}
                  </span>
                  {draft === opt && <Check className="w-3 h-3 ml-auto text-primary" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return editing ? (
    <input
      ref={ref as React.RefObject<HTMLInputElement>}
      autoFocus
      type={type}
      value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setDraft(String(value)); setEditing(false); } }}
      className="w-full text-sm border-0 outline-none bg-blue-50 rounded px-2 py-0.5 ring-2 ring-primary/30 text-slate-900 font-medium"
    />
  ) : (
    <div
      onClick={() => setEditing(true)}
      className="text-sm text-slate-700 hover:bg-slate-50 px-2 py-0.5 rounded cursor-text min-h-[26px] transition-colors"
    >
      {value !== "" && value !== null && value !== undefined
        ? (type === "number" ? IDR_FULL(Number(value)) : String(value))
        : <span className="text-slate-300 italic">—</span>}
    </div>
  );
}

function BarChartView({ orders, getLabel }: { orders: any[]; getLabel: (o: any) => string }) {
  type MonthBucket = { label: string; total: number; byStatus: Record<string, number> };
  const buckets: Record<string, MonthBucket> = {};

  orders.forEach(o => {
    const d = new Date(o.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const monthLabel = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    if (!buckets[key]) buckets[key] = { label: monthLabel, total: 0, byStatus: {} };
    const amt = Number(o.total_amount || 0);
    buckets[key].total += amt;
    buckets[key].byStatus[o.status] = (buckets[key].byStatus[o.status] || 0) + amt;
  });

  const sorted = Object.entries(buckets).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
  const maxVal = Math.max(...sorted.map(b => b.total), 1);

  const statusColors: Record<string, string> = {
    pending: "#d4d4d4",
    waiting_payment: "#fbbf24",
    cancelled: "#f87171",
    paid: "#60a5fa",
    processing: "#a78bfa",
    completed: "#34d399",
  };

  return (
    <div className="flex-1 px-8 pt-8 pb-4 overflow-auto">
      <div className="flex items-end gap-6 h-64 min-w-0">
        {sorted.map((bucket, i) => {
          const barHeight = (bucket.total / maxVal) * 100;
          return (
            <div key={i} className="flex flex-col items-center gap-2 flex-1 min-w-[60px]">
              <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap">{IDR(bucket.total)}</span>
              <div className="relative w-full flex flex-col-reverse rounded-t-md overflow-hidden" style={{ height: `${Math.max(barHeight, 4)}%`, minHeight: 4 }}>
                {ALL_STATUSES.map(st => {
                  const amt = bucket.byStatus[st] || 0;
                  if (!amt) return null;
                  const pct = (amt / bucket.total) * 100;
                  return (
                    <div
                      key={st}
                      title={`${STATUS_CONFIG[st]?.label}: ${IDR_FULL(amt)}`}
                      style={{ height: `${pct}%`, background: statusColors[st] || "#d4d4d4", minHeight: 2 }}
                    />
                  );
                })}
              </div>
              <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap">{bucket.label}</span>
            </div>
          );
        })}
        {sorted.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-slate-300 text-sm">Belum ada data</div>
        )}
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

export default function ManajemenClient() {
  const supabase = createClient();
  const { showToast } = useToast();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("chart");
  const [search, setSearch] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const getFormData = (o: any) => {
    try { return typeof o.form_data === "string" ? JSON.parse(o.form_data) : (o.form_data || {}); }
    catch { return {}; }
  };

  const getInvoiceNumber = (o: any) => o.order_number || "—";

  const getClientName = (o: any) => {
    if (o.client?.full_name) return o.client.full_name;
    if (o.client?.email) return o.client.email.split("@")[0];
    if (o.guest_name) return o.guest_name;
    const fd = getFormData(o);
    return fd.customer_name || fd["Client Name"] || "—";
  };

  const getClientWhatsApp = (o: any) => {
    if (o.guest_phone) return o.guest_phone;
    const fd = getFormData(o);
    return fd.whatsapp || fd["whatsapp"] || "—";
  };

  const getService = (o: any) => o.store_services?.title || o.store_products?.title || o.custom_item_name || "—";

  const getPackage = (o: any) => {
    try {
      const sp = typeof o.selected_package === "string"
        ? JSON.parse(o.selected_package)
        : o.selected_package;
      return sp?.name || o.custom_package_name || "—";
    } catch { return o.custom_package_name || "—"; }
  };

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data: profiles } = await supabase.from("users").select("id, full_name, email");
      const profileMap: Record<string, any> = {};
      (profiles || []).forEach((p: any) => { if (p.id) profileMap[p.id] = p; });

      const { data, error } = await supabase
        .from("store_orders")
        .select("*, store_products(title, category), store_services(title, category)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders((data || []).map((o: any) => ({ ...o, client: profileMap[o.user_id] || null })));
    } catch (err: any) {
      showToast(err.message || "Gagal memuat data", "error");
    } finally {
      setLoading(false);
    }
  }, [supabase, showToast]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const updateField = async (id: string, field: string, value: string | number) => {
    setSaving(s => ({ ...s, [id]: true }));
    const payload: any = { [field]: value };
    if (field === "total_amount") payload[field] = Number(value);
    const { error } = await supabase.from("store_orders").update(payload).eq("id", id);
    if (error) showToast("Gagal menyimpan", "error");
    else {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, [field]: value } : o));
    }
    setSaving(s => ({ ...s, [id]: false }));
  };

  const updateClientName = async (id: string, name: string, o: any) => {
    setSaving(s => ({ ...s, [id]: true }));
    const fd = getFormData(o);
    const updatedFd = { ...fd, customer_name: name, "Client Name": name };
    const payload: any = { form_data: updatedFd };
    if (o.guest_name !== undefined) payload.guest_name = name;
    const { error } = await supabase.from("store_orders").update(payload).eq("id", id);
    if (error) showToast("Gagal menyimpan", "error");
    else fetchOrders();
    setSaving(s => ({ ...s, [id]: false }));
  };

  const updateClientPhone = async (id: string, phone: string, o: any) => {
    setSaving(s => ({ ...s, [id]: true }));
    const fd = getFormData(o);
    const updatedFd = { ...fd, whatsapp: phone };
    const payload: any = { form_data: updatedFd };
    if (o.guest_phone !== undefined) payload.guest_phone = phone;
    const { error } = await supabase.from("store_orders").update(payload).eq("id", id);
    if (error) showToast("Gagal menyimpan", "error");
    else fetchOrders();
    setSaving(s => ({ ...s, [id]: false }));
  };

  const filtered = orders.filter(o => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      getInvoiceNumber(o).toLowerCase().includes(q) ||
      getClientName(o).toLowerCase().includes(q) ||
      getService(o).toLowerCase().includes(q) ||
      getPackage(o).toLowerCase().includes(q)
    );
  });

  const groupByMonth = (rows: any[]) => {
    const groups: Record<string, { label: string; rows: any[]; key: string }> = {};
    rows.forEach(o => {
      const d = new Date(o.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
      if (!groups[key]) groups[key] = { label, rows: [], key };
      groups[key].rows.push(o);
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a)).map(([, v]) => v);
  };

  const groupByStatus = (rows: any[]) => {
    const groups: Record<string, { label: string; rows: any[]; key: string; cfg: any }> = {};
    ALL_STATUSES.forEach(st => {
      groups[st] = { label: STATUS_CONFIG[st].label, rows: [], key: st, cfg: STATUS_CONFIG[st] };
    });
    rows.forEach(o => {
      const st = o.status || "pending";
      if (!groups[st]) groups[st] = { label: STATUS_CONFIG[st]?.label || st, rows: [], key: st, cfg: STATUS_CONFIG[st] };
      groups[st].rows.push(o);
    });
    return Object.values(groups).filter(g => g.rows.length > 0);
  };

  const toggleGroup = (key: string) => {
    setExpandedGroups(eg => ({ ...eg, [key]: !(eg[key] ?? true) }));
  };

  const isExpanded = (key: string) => expandedGroups[key] ?? true;

  const COLUMNS = [
    { key: "no", label: "N°", width: "w-10" },
    { key: "invoice", label: "Invoice Number", icon: <FileText className="w-3 h-3" />, width: "w-44" },
    { key: "client_name", label: "Customer Name", icon: <span className="text-slate-400">👤</span>, width: "w-40" },
    { key: "whatsapp", label: "Customer WhatsApp", icon: <Phone className="w-3 h-3" />, width: "w-44" },
    { key: "service", label: "Service", icon: <span className="text-slate-400">🛍️</span>, width: "w-36" },
    { key: "package", label: "Package", icon: <span className="text-slate-400">📦</span>, width: "w-28" },
    { key: "total_amount", label: "Total Price", icon: <span className="text-slate-400">💰</span>, width: "w-36" },
    { key: "discount", label: "Discount", icon: <span className="text-slate-400">🏷️</span>, width: "w-36" },
    { key: "status", label: "Status", icon: <span className="text-slate-400">🕐</span>, width: "w-36" },
  ];

  function TableRow({ o, idx }: { o: any; idx: number }) {
    const isSaving = saving[o.id];
    return (
      <tr className="group border-b border-slate-100 hover:bg-slate-50/60 transition-colors relative">
        <td className="px-3 py-2 text-slate-400 text-xs select-none w-10 text-center">{idx}</td>
        <td className="px-3 py-2">
          <div className="flex items-center gap-1.5">
            <FileText className="w-3 h-3 text-slate-300 shrink-0" />
            <span className="text-xs font-mono text-slate-600">{getInvoiceNumber(o)}</span>
            {isSaving && <Loader2 className="w-3 h-3 animate-spin text-primary ml-1" />}
          </div>
        </td>
        <td className="px-3 py-2">
          <InlineCell
            value={getClientName(o)}
            onChange={v => updateClientName(o.id, v, o)}
          />
        </td>
        <td className="px-3 py-2">
          <InlineCell
            value={getClientWhatsApp(o)}
            onChange={v => updateClientPhone(o.id, v, o)}
          />
        </td>
        <td className="px-3 py-2">
          <span className="text-sm text-slate-600">{getService(o)}</span>
        </td>
        <td className="px-3 py-2">
          <span className="text-sm text-slate-600">{getPackage(o)}</span>
        </td>
        <td className="px-3 py-2">
          <InlineCell
            value={Number(o.total_amount || 0)}
            type="number"
            onChange={v => updateField(o.id, "total_amount", v)}
          />
        </td>
        <td className="px-3 py-2">
          <span className="text-sm text-slate-500">
            {o.discount_amount ? IDR_FULL(Number(o.discount_amount)) : "—"}
          </span>
        </td>
        <td className="px-3 py-2">
          <InlineCell
            value={o.status || "pending"}
            type="status"
            onChange={v => updateField(o.id, "status", v)}
          />
        </td>
      </tr>
    );
  }

  function GroupedTable({ groups }: { groups: { label: string; rows: any[]; key: string; cfg?: any }[] }) {
    return (
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left min-w-[900px]">
          <thead className="sticky top-0 z-10 bg-white border-b border-slate-200">
            <tr>
              {COLUMNS.map(col => (
                <th key={col.key} className={`px-3 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap ${col.width}`}>
                  <span className="flex items-center gap-1">
                    {col.icon}
                    {col.label}
                  </span>
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
                  <tr
                    className="bg-slate-50/80 cursor-pointer hover:bg-slate-100/80 transition-colors"
                    onClick={() => toggleGroup(group.key)}
                  >
                    <td colSpan={COLUMNS.length + 1} className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        {expanded
                          ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                          : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
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
                  {expanded && group.rows.map((o, i) => (
                    <TableRow key={o.id} o={o} idx={i + 1} />
                  ))}
                  {expanded && (
                    <tr className="border-b border-slate-100 bg-slate-50/30">
                      <td colSpan={4} />
                      <td colSpan={2} className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">SUM</td>
                      <td className="px-3 py-2">
                        <span className="text-sm font-bold" style={{ color: "#1d4ed8" }}>{IDR_FULL(groupTotal)}</span>
                      </td>
                      <td colSpan={3} />
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  const viewTabs: { key: ViewMode; label: string; icon: React.ReactNode }[] = [
    { key: "chart", label: "Chart", icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { key: "table", label: "Table", icon: <LayoutGrid className="w-3.5 h-3.5" /> },
    { key: "status", label: "Status", icon: <Tag className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex flex-col h-full min-h-screen bg-white">
      <div className="px-8 pt-8 pb-4 border-b border-slate-100">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-4">MyProjects</h1>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1">
            {viewTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setView(tab.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  view === tab.key
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm text-slate-500 hover:bg-slate-100 transition-colors">
              <Filter className="w-3.5 h-3.5" />
            </button>
            <button className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm text-slate-500 hover:bg-slate-100 transition-colors">
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
            <button className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm text-slate-500 hover:bg-slate-100 transition-colors">
              <Zap className="w-3.5 h-3.5" />
            </button>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari..."
                className="pl-8 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-md outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 w-48"
              />
            </div>
            <button className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm text-slate-500 hover:bg-slate-100 transition-colors">
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
            <button className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-md text-sm font-semibold transition-colors shadow-sm">
              <Plus className="w-3.5 h-3.5" />
              New
              <ChevronDown className="w-3 h-3 ml-0.5" />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {view === "chart" && (
            <BarChartView orders={filtered} getLabel={o => getClientName(o)} />
          )}

          {view === "table" && (
            <GroupedTable groups={groupByMonth(filtered)} />
          )}

          {view === "status" && (
            <GroupedTable
              groups={groupByStatus(filtered).map(g => ({
                ...g,
                cfg: STATUS_CONFIG[g.key],
              }))}
            />
          )}

          <div className="border-t border-slate-100 px-4 py-2">
            <button className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors">
              <Plus className="w-3.5 h-3.5" />
              New page
            </button>
          </div>
        </>
      )}
    </div>
  );
}
