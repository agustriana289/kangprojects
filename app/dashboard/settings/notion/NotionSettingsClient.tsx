"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ToastProvider";
import {
  CheckCircle2, AlertCircle, Loader2, ExternalLink, Eye, EyeOff,
  Settings, RefreshCcw, Database, ToggleLeft, ToggleRight, Clock, Zap, Hand
} from "lucide-react";

type NotionSettings = {
  enabled: boolean;
  token: string;
  projectsDbId: string;
  marketDbId: string;
  servicesDbId: string;
  lastSyncProjectsAt: string | null;
  lastSyncMarketAt: string | null;
  lastSyncServicesAt: string | null;
};

type VerifyKey = "projects" | "market" | "services";
type VerifyState = Record<VerifyKey, "idle" | "loading" | "ok" | "error">;

const DB_CONFIGS: { key: VerifyKey; label: string; stateKey: keyof NotionSettings; syncKey: keyof NotionSettings; mode: "auto" | "manual"; desc: string }[] = [
  {
    key: "projects",
    label: "Database — Orders / Projects",
    stateKey: "projectsDbId",
    syncKey: "lastSyncProjectsAt",
    mode: "manual",
    desc: "Sync manual per bulan dari halaman Projects",
  },
  {
    key: "market",
    label: "Database — Manajemen Market",
    stateKey: "marketDbId",
    syncKey: "lastSyncMarketAt",
    mode: "auto",
    desc: "Auto-sync setiap kali ada perubahan pada data market",
  },
  {
    key: "services",
    label: "Database — Layanan / Services",
    stateKey: "servicesDbId",
    syncKey: "lastSyncServicesAt",
    mode: "auto",
    desc: "Auto-sync setiap kali layanan disimpan atau status berubah",
  },
];

export default function NotionSettingsClient() {
  const supabase = createClient();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [settings, setSettings] = useState<NotionSettings>({
    enabled: false,
    token: "",
    projectsDbId: "",
    marketDbId: "",
    servicesDbId: "",
    lastSyncProjectsAt: null,
    lastSyncMarketAt: null,
    lastSyncServicesAt: null,
  });
  const [verify, setVerify] = useState<VerifyState>({ projects: "idle", market: "idle", services: "idle" });
  const [verifyNames, setVerifyNames] = useState<Record<VerifyKey, string>>({ projects: "", market: "", services: "" });

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("app_settings")
      .select("key, value")
      .in("key", [
        "notion_enabled", "notion_token",
        "notion_projects_db_id", "notion_market_db_id", "notion_services_db_id",
        "notion_last_sync_projects_at", "notion_last_sync_market_at", "notion_last_sync_services_at",
      ]);

    const map: Record<string, string | null> = {};
    (data || []).forEach((r: { key: string; value: string | null }) => { map[r.key] = r.value; });

    setSettings({
      enabled: map["notion_enabled"] === "true",
      token: map["notion_token"] || "",
      projectsDbId: map["notion_projects_db_id"] || "",
      marketDbId: map["notion_market_db_id"] || "",
      servicesDbId: map["notion_services_db_id"] || "",
      lastSyncProjectsAt: map["notion_last_sync_projects_at"] || null,
      lastSyncMarketAt: map["notion_last_sync_market_at"] || null,
      lastSyncServicesAt: map["notion_last_sync_services_at"] || null,
    });
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    const rows = [
      { key: "notion_enabled", value: String(settings.enabled), updated_at: new Date().toISOString() },
      { key: "notion_token", value: settings.token || null, updated_at: new Date().toISOString() },
      { key: "notion_projects_db_id", value: settings.projectsDbId || null, updated_at: new Date().toISOString() },
      { key: "notion_market_db_id", value: settings.marketDbId || null, updated_at: new Date().toISOString() },
      { key: "notion_services_db_id", value: settings.servicesDbId || null, updated_at: new Date().toISOString() },
    ];
    const { error } = await supabase.from("app_settings").upsert(rows);
    if (error) showToast("Gagal menyimpan: " + error.message, "error");
    else showToast("Konfigurasi Notion disimpan", "success");
    await fetchSettings();
    setSaving(false);
  };

  const handleVerify = async (type: VerifyKey) => {
    const dbId = settings[DB_CONFIGS.find(c => c.key === type)!.stateKey] as string;
    if (!settings.token || !dbId) return showToast("Isi token dan Database ID terlebih dahulu", "error");
    setVerify(v => ({ ...v, [type]: "loading" }));
    try {
      const res = await fetch("/api/notion/verify-database", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: settings.token, databaseId: dbId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setVerify(v => ({ ...v, [type]: "error" }));
        showToast(data.error || "Database tidak ditemukan", "error");
      } else {
        setVerify(v => ({ ...v, [type]: "ok" }));
        setVerifyNames(n => ({ ...n, [type]: data.title }));
        showToast(`Database "${data.title}" ditemukan!`, "success");
      }
    } catch {
      setVerify(v => ({ ...v, [type]: "error" }));
      showToast("Koneksi gagal", "error");
    }
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return null;
    return new Date(iso).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
  };

  const verifyIcon = (state: "idle" | "loading" | "ok" | "error") => {
    if (state === "loading") return <Loader2 className="w-3.5 h-3.5 animate-spin" />;
    if (state === "ok") return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
    if (state === "error") return <AlertCircle className="w-3.5 h-3.5 text-rose-500" />;
    return <RefreshCcw className="w-3.5 h-3.5" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight mb-1">Integrasi Notion</h2>
        <p className="text-sm font-medium text-slate-500 border-b border-slate-100 pb-4">
          Sinkronisasi project (manual), market dan layanan (otomatis) ke Notion database.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-bold text-slate-900">Konfigurasi</h3>
          </div>
          <button
            onClick={() => setSettings(s => ({ ...s, enabled: !s.enabled }))}
            className="flex items-center gap-2 text-sm font-bold transition-colors"
          >
            {settings.enabled ? (
              <>
                <ToggleRight className="w-6 h-6 text-primary" />
                <span className="text-primary">Aktif</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-6 h-6 text-slate-400" />
                <span className="text-slate-400">Nonaktif</span>
              </>
            )}
          </button>
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
            Notion Integration Token
          </label>
          <div className="relative">
            <input
              type={showToken ? "text" : "password"}
              value={settings.token}
              onChange={e => setSettings(s => ({ ...s, token: e.target.value }))}
              placeholder="secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full px-3 py-2.5 pr-10 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 font-mono"
            />
            <button
              onClick={() => setShowToken(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-1.5">
            Buat integration di <span className="font-mono">notion.so/my-integrations</span> dan salin token di sini.
          </p>
        </div>

        <div className="space-y-4">
          {DB_CONFIGS.map(cfg => {
            const dbId = settings[cfg.stateKey] as string;
            const lastSync = settings[cfg.syncKey] as string | null;
            return (
              <div key={cfg.key} className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {cfg.label}
                  </label>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    cfg.mode === "auto"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                      : "bg-slate-100 text-slate-500 border border-slate-200"
                  }`}>
                    {cfg.mode === "auto" ? <Zap className="w-2.5 h-2.5" /> : <Hand className="w-2.5 h-2.5" />}
                    {cfg.mode === "auto" ? "Auto Sync" : "Manual"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">{cfg.desc}</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={dbId}
                    onChange={e => {
                      setSettings(s => ({ ...s, [cfg.stateKey]: e.target.value }));
                      setVerify(v => ({ ...v, [cfg.key]: "idle" }));
                    }}
                    placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                  />
                  <button
                    onClick={() => handleVerify(cfg.key)}
                    disabled={verify[cfg.key] === "loading"}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors disabled:opacity-60"
                    title="Verifikasi database"
                  >
                    {verifyIcon(verify[cfg.key])}
                  </button>
                </div>
                {verify[cfg.key] === "ok" && verifyNames[cfg.key] && (
                  <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {verifyNames[cfg.key]}
                  </p>
                )}
                {verify[cfg.key] === "error" && (
                  <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Database tidak ditemukan atau tidak dapat diakses
                  </p>
                )}
                {lastSync && (
                  <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Sync terakhir: {formatDate(lastSync)}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-xl transition-colors shadow-sm disabled:opacity-60"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Simpan Konfigurasi
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-bold text-slate-900">Kolom Database yang Diperlukan</h3>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Orders / Projects</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 px-3 font-bold text-slate-500">Kolom</th>
                  <th className="text-left py-2 px-3 font-bold text-slate-500">Tipe Notion</th>
                  <th className="text-left py-2 px-3 font-bold text-slate-500">Sumber</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {[
                  { name: "Proyek", type: "Title", src: "Judul proyek" },
                  { name: "No Invoice", type: "Rich Text", src: "Nomor order" },
                  { name: "Klien", type: "Rich Text", src: "Nama klien" },
                  { name: "WhatsApp", type: "Phone Number", src: "No. WhatsApp klien" },
                  { name: "Layanan", type: "Rich Text", src: "Nama layanan / produk" },
                  { name: "Package", type: "Rich Text", src: "Nama paket" },
                  { name: "Total Harga", type: "Number", src: "Total harga" },
                  { name: "Discount", type: "Number", src: "Jumlah diskon" },
                  { name: "Status", type: "Select", src: "No Status / Belum Dibayar / Dibatalkan / Dibayar / Dikerjakan / Selesai" },
                  { name: "Tanggal Masuk", type: "Date", src: "Tanggal order dibuat" },
                  { name: "File", type: "URL", src: "form_data.final_file_url" },
                  { name: "Deadline", type: "Date", src: "form_data.deadline" },
                  { name: "Email Klien", type: "Email", src: "Email klien" },
                ].map(col => (
                  <tr key={col.name}>
                    <td className="py-2 px-3 font-mono font-semibold text-slate-700">{col.name}</td>
                    <td className="py-2 px-3 text-slate-500">{col.type}</td>
                    <td className="py-2 px-3 text-slate-400">{col.src}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Manajemen Market (Items/Products)</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 px-3 font-bold text-slate-500">Kolom</th>
                  <th className="text-left py-2 px-3 font-bold text-slate-500">Tipe Notion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {[
                  { name: "Produk", type: "Title" },
                  { name: "Kategori", type: "Select" },
                  { name: "Deskripsi", type: "Rich Text" },
                  { name: "Slug", type: "Rich Text" },
                  { name: "Harga Mulai", type: "Number" },
                  { name: "Harga Tertinggi", type: "Number" },
                  { name: "Jumlah Paket", type: "Number" },
                  { name: "Detail Paket", type: "Rich Text" },
                  { name: "Status", type: "Select (Diterbitkan / Draf)" },
                ].map(col => (
                  <tr key={col.name}>
                    <td className="py-2 px-3 font-mono font-semibold text-slate-700">{col.name}</td>
                    <td className="py-2 px-3 text-slate-500">{col.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Layanan / Services</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 px-3 font-bold text-slate-500">Kolom</th>
                  <th className="text-left py-2 px-3 font-bold text-slate-500">Tipe Notion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {[
                  { name: "Layanan", type: "Title" },
                  { name: "Kategori", type: "Select" },
                  { name: "Deskripsi", type: "Rich Text" },
                  { name: "Slug", type: "Rich Text" },
                  { name: "Harga Mulai", type: "Number" },
                  { name: "Harga Tertinggi", type: "Number" },
                  { name: "Jumlah Paket", type: "Number" },
                  { name: "Detail Paket", type: "Rich Text" },
                  { name: "Status", type: "Select (Diterbitkan / Draf)" },
                  { name: "Unggulan", type: "Checkbox" },
                ].map(col => (
                  <tr key={col.name}>
                    <td className="py-2 px-3 font-mono font-semibold text-slate-700">{col.name}</td>
                    <td className="py-2 px-3 text-slate-500">{col.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-2">Cara Setup</h4>
        <ol className="text-xs font-medium text-amber-800 space-y-1.5 list-decimal pl-4">
          <li>Buka <span className="font-mono">notion.so/my-integrations</span> → buat integration baru → salin <span className="font-bold">Internal Integration Token</span>.</li>
          <li>Buat 3 Database Notion: satu untuk <b>Orders/Projects</b>, satu untuk <b>Market</b>, satu untuk <b>Services</b>.</li>
          <li>Setiap database → klik <span className="font-bold">⋯</span> → <span className="font-bold">Add connections</span> → pilih integration yang dibuat.</li>
          <li>Salin Database ID dari URL: <span className="font-mono bg-amber-100 px-1 rounded">notion.so/[ws]/<b>DATABASE_ID</b>?v=...</span></li>
          <li>Isi Token dan 3 Database ID di atas → verifikasi masing-masing → Simpan.</li>
          <li><span className="font-bold">Market & Services</span> sync otomatis setiap ada perubahan. <span className="font-bold">Orders</span> sync manual per bulan dari halaman Projects.</li>
        </ol>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <ExternalLink className="w-4 h-4 text-slate-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">Tautan Berguna</h4>
        </div>
        <div className="space-y-1.5">
          <a href="https://notion.so/my-integrations" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
            <ExternalLink className="w-3 h-3" /> notion.so/my-integrations — Buat Integration Token
          </a>
          <a href="https://developers.notion.com/docs/getting-started" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
            <ExternalLink className="w-3 h-3" /> Dokumentasi Notion API
          </a>
        </div>
      </div>
    </div>
  );
}
