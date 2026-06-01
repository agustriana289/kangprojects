"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ToastProvider";
import {
  CheckCircle2, AlertCircle, Loader2, ExternalLink, Eye, EyeOff,
  Settings, RefreshCcw, Database, ToggleLeft, ToggleRight, Clock
} from "lucide-react";

type NotionSettings = {
  enabled: boolean;
  token: string;
  projectsDbId: string;
  marketDbId: string;
  lastSyncProjectsAt: string | null;
  lastSyncMarketAt: string | null;
};

type VerifyState = {
  projects: "idle" | "loading" | "ok" | "error";
  market: "idle" | "loading" | "ok" | "error";
};

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
    lastSyncProjectsAt: null,
    lastSyncMarketAt: null,
  });
  const [verify, setVerify] = useState<VerifyState>({ projects: "idle", market: "idle" });
  const [verifyNames, setVerifyNames] = useState({ projects: "", market: "" });

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("app_settings")
      .select("key, value")
      .in("key", [
        "notion_enabled",
        "notion_token",
        "notion_projects_db_id",
        "notion_market_db_id",
        "notion_last_sync_projects_at",
        "notion_last_sync_market_at",
      ]);

    const map: Record<string, string | null> = {};
    (data || []).forEach((r: { key: string; value: string | null }) => {
      map[r.key] = r.value;
    });

    setSettings({
      enabled: map["notion_enabled"] === "true",
      token: map["notion_token"] || "",
      projectsDbId: map["notion_projects_db_id"] || "",
      marketDbId: map["notion_market_db_id"] || "",
      lastSyncProjectsAt: map["notion_last_sync_projects_at"] || null,
      lastSyncMarketAt: map["notion_last_sync_market_at"] || null,
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
    ];
    const { error } = await supabase.from("app_settings").upsert(rows);
    if (error) showToast("Gagal menyimpan: " + error.message, "error");
    else showToast("Konfigurasi Notion disimpan", "success");
    await fetchSettings();
    setSaving(false);
  };

  const handleVerify = async (type: "projects" | "market") => {
    const dbId = type === "projects" ? settings.projectsDbId : settings.marketDbId;
    if (!settings.token || !dbId) {
      return showToast("Isi token dan Database ID terlebih dahulu", "error");
    }
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
          Sinkronisasi project dan data manajemen ke Notion database secara otomatis.
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
              Database ID — Projects
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={settings.projectsDbId}
                onChange={e => { setSettings(s => ({ ...s, projectsDbId: e.target.value })); setVerify(v => ({ ...v, projects: "idle" })); }}
                placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="flex-1 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 font-mono"
              />
              <button
                onClick={() => handleVerify("projects")}
                disabled={verify.projects === "loading"}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors disabled:opacity-60"
              >
                {verifyIcon(verify.projects)}
              </button>
            </div>
            {verify.projects === "ok" && verifyNames.projects && (
              <p className="text-[11px] text-emerald-600 font-medium mt-1.5 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> {verifyNames.projects}
              </p>
            )}
            {verify.projects === "error" && (
              <p className="text-[11px] text-rose-500 font-medium mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Database tidak ditemukan atau tidak dapat diakses
              </p>
            )}
            {settings.lastSyncProjectsAt && (
              <p className="text-[11px] text-slate-400 font-medium mt-1.5 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Sync terakhir: {formatDate(settings.lastSyncProjectsAt)}
              </p>
            )}
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
              Database ID — Manajemen Market
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={settings.marketDbId}
                onChange={e => { setSettings(s => ({ ...s, marketDbId: e.target.value })); setVerify(v => ({ ...v, market: "idle" })); }}
                placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="flex-1 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 font-mono"
              />
              <button
                onClick={() => handleVerify("market")}
                disabled={verify.market === "loading"}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors disabled:opacity-60"
              >
                {verifyIcon(verify.market)}
              </button>
            </div>
            {verify.market === "ok" && verifyNames.market && (
              <p className="text-[11px] text-emerald-600 font-medium mt-1.5 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> {verifyNames.market}
              </p>
            )}
            {verify.market === "error" && (
              <p className="text-[11px] text-rose-500 font-medium mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Database tidak ditemukan atau tidak dapat diakses
              </p>
            )}
            {settings.lastSyncMarketAt && (
              <p className="text-[11px] text-slate-400 font-medium mt-1.5 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Sync terakhir: {formatDate(settings.lastSyncMarketAt)}
              </p>
            )}
          </div>
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

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-bold text-slate-900">Kolom Database Notion yang Diperlukan</h3>
        </div>
        <p className="text-xs font-medium text-slate-500">
          Pastikan database Notion Anda memiliki kolom-kolom berikut (nama dan tipe harus sama persis):
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 px-3 font-bold text-slate-500 uppercase tracking-wider">Nama Kolom</th>
                <th className="text-left py-2 px-3 font-bold text-slate-500 uppercase tracking-wider">Tipe Notion</th>
                <th className="text-left py-2 px-3 font-bold text-slate-500 uppercase tracking-wider">Sumber Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {[
                { name: "Proyek", type: "Title", src: "Judul proyek (wajib)" },
                { name: "No. Order", type: "Rich Text", src: "Nomor order" },
                { name: "Klien", type: "Rich Text", src: "Nama klien" },
                { name: "WhatsApp", type: "Phone Number", src: "No. WhatsApp klien" },
                { name: "Layanan", type: "Rich Text", src: "Nama layanan" },
                { name: "Package", type: "Rich Text", src: "Nama paket layanan" },
                { name: "Total Harga", type: "Number", src: "Total harga pesanan" },
                { name: "Discount", type: "Number", src: "Jumlah diskon" },
                { name: "Status", type: "Select", src: "No Status / Belum Dibayar / Dibatalkan / Dibayar / Dikerjakan / Selesai" },
                { name: "Tanggal Masuk", type: "Date", src: "Tanggal order dibuat" },
                { name: "Final File", type: "URL", src: "URL file akhir (dari form_data.final_file_url)" },
                { name: "Deadline", type: "Date", src: "Tanggal deadline (dari form_data.deadline)" },
                { name: "Customer Email", type: "Email", src: "Email klien" },
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

      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-2">Cara Setup</h4>
        <ol className="text-xs font-medium text-amber-800 space-y-1.5 list-decimal pl-4">
          <li>Buka <span className="font-mono">notion.so/my-integrations</span> → buat integration baru → salin <span className="font-bold">Internal Integration Token</span>.</li>
          <li>Buat dua Database Notion (satu untuk Projects, satu untuk Manajemen Market).</li>
          <li>Buka database → klik <span className="font-bold">⋯</span> → <span className="font-bold">Add connections</span> → pilih integration yang baru dibuat.</li>
          <li>Salin Database ID dari URL: <span className="font-mono bg-amber-100 px-1 rounded">notion.so/[workspace]/<b>DATABASE_ID</b>?v=...</span></li>
          <li>Tempel Token dan Database ID di form di atas → klik ikon verifikasi → Simpan.</li>
          <li>Sync otomatis berjalan setiap hari. Manual sync tersedia di halaman Projects dan Manajemen.</li>
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
