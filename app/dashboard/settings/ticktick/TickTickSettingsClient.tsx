"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ToastProvider";
import { CheckCircle2, AlertCircle, Loader2, ExternalLink, Link2Off, Settings, RefreshCcw, ListTodo } from "lucide-react";
import { useSearchParams } from "next/navigation";

type TickTickStatus = {
  connected: boolean;
  tokenExpiresAt: string | null;
  projectId: string | null;
};

export default function TickTickSettingsClient() {
  const supabase = createClient();
  const { showToast } = useToast();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<TickTickStatus>({
    connected: false,
    tokenExpiresAt: null,
    projectId: null,
  });
  const [projectId, setProjectId] = useState("");
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [fetchingProjects, setFetchingProjects] = useState(false);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("app_settings")
      .select("key, value")
      .in("key", ["ticktick_enabled", "ticktick_token_expires_at", "ticktick_project_id"]);

    const map: Record<string, string | null> = {};
    (data || []).forEach((r: { key: string; value: string | null }) => {
      map[r.key] = r.value;
    });

    setStatus({
      connected: map["ticktick_enabled"] === "true",
      tokenExpiresAt: map["ticktick_token_expires_at"] || null,
      projectId: map["ticktick_project_id"] || null,
    });
    setProjectId(map["ticktick_project_id"] || "");
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    const ticktick = searchParams.get("ticktick");
    if (ticktick === "success") {
      showToast("TickTick berhasil terhubung!", "success");
      fetchStatus();
    } else if (ticktick === "error") {
      const reason = searchParams.get("reason") || "Unknown error";
      showToast(`Gagal menghubungkan TickTick: ${reason}`, "error");
    }
  }, [searchParams, showToast, fetchStatus]);

  const handleConnect = () => {
    window.location.href = "/api/ticktick/oauth";
  };

  const handleDisconnect = async () => {
    if (!confirm("Putuskan koneksi TickTick? Token akan dihapus.")) return;
    setSaving(true);
    const rows = [
      { key: "ticktick_access_token", value: null, updated_at: new Date().toISOString() },
      { key: "ticktick_refresh_token", value: null, updated_at: new Date().toISOString() },
      { key: "ticktick_token_expires_at", value: null, updated_at: new Date().toISOString() },
      { key: "ticktick_enabled", value: "false", updated_at: new Date().toISOString() },
    ];
    await supabase.from("app_settings").upsert(rows);
    showToast("TickTick diputuskan", "success");
    await fetchStatus();
    setSaving(false);
  };

  const fetchProjects = async () => {
    setFetchingProjects(true);
    try {
      const res = await fetch("/api/ticktick/projects");
      const data = await res.json();
      if (data.projects) {
        setProjects(data.projects);
        showToast(`${data.projects.length} proyek ditemukan`, "success");
      } else {
        showToast(data.error || "Gagal mengambil daftar proyek", "error");
      }
    } catch {
      showToast("Gagal mengambil daftar proyek", "error");
    } finally {
      setFetchingProjects(false);
    }
  };

  const handleSaveProject = async () => {
    setSaving(true);
    await supabase.from("app_settings").upsert({
      key: "ticktick_project_id",
      value: projectId || null,
      updated_at: new Date().toISOString(),
    });
    showToast("Project ID disimpan", "success");
    await fetchStatus();
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const expiresDate = status.tokenExpiresAt ? new Date(status.tokenExpiresAt) : null;
  const isExpired = expiresDate ? expiresDate < new Date() : false;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight mb-1">Integrasi TickTick</h2>
        <p className="text-sm font-medium text-slate-500 border-b border-slate-100 pb-4">
          Otomatis buat task di TickTick setiap ada pesanan baru masuk.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-2xl shrink-0 ${status.connected && !isExpired ? "bg-emerald-50" : "bg-slate-100"}`}>
            <ListTodo className={`w-6 h-6 ${status.connected && !isExpired ? "text-emerald-500" : "text-slate-400"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="text-sm font-bold text-slate-900">Status Koneksi</h3>
              {status.connected && !isExpired ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                  <CheckCircle2 className="w-3 h-3" /> Terhubung
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                  <AlertCircle className="w-3 h-3" /> Belum Terhubung
                </span>
              )}
            </div>
            {status.connected && expiresDate && (
              <p className="text-xs font-medium text-slate-500">
                Token {isExpired ? "kedaluwarsa" : "berlaku hingga"}: {expiresDate.toLocaleString("id-ID")}
              </p>
            )}
            {!status.connected && (
              <p className="text-xs font-medium text-slate-500">
                Hubungkan akun TickTick Anda untuk mulai sinkronisasi pesanan otomatis.
              </p>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            {status.connected ? (
              <button
                onClick={handleDisconnect}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-rose-500 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-xl transition-colors disabled:opacity-60"
              >
                <Link2Off className="w-3.5 h-3.5" /> Putuskan
              </button>
            ) : (
              <button
                onClick={handleConnect}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary/90 rounded-xl transition-colors shadow-sm"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Hubungkan
              </button>
            )}
            {status.connected && (
              <button
                onClick={handleConnect}
                className="inline-flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
                title="Reconnect / Refresh Token"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {status.connected && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-bold text-slate-900">Konfigurasi Project</h3>
          </div>
          <p className="text-xs font-medium text-slate-500">
            Pilih project TickTick tujuan task pesanan. Kosongkan untuk menggunakan Inbox default.
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchProjects}
              disabled={fetchingProjects}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors disabled:opacity-60"
            >
              {fetchingProjects ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />}
              Muat Daftar Project
            </button>
          </div>

          {projects.length > 0 && (
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 block">Pilih Project</label>
              <select
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
              >
                <option value="">— Inbox (Default) —</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          {projects.length === 0 && (
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">Project ID Manual</label>
              <input
                type="text"
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
                placeholder="Muat daftar project di atas, atau isi ID manual..."
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-[11px] text-slate-400 font-medium mt-1.5">
                Klik &quot;Muat Daftar Project&quot; untuk mengambil daftar project dari TickTick secara otomatis.
              </p>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveProject}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-xl transition-colors shadow-sm disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Simpan Konfigurasi
            </button>
          </div>
        </div>
      )}

      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-2">Cara Setup</h4>
        <ol className="text-xs font-medium text-amber-800 space-y-1.5 list-decimal pl-4">
          <li>Daftarkan aplikasi di <span className="font-mono">developer.ticktick.com</span> dan buat App baru.</li>
          <li>Isi <span className="font-mono">Redirect URI</span> dengan <span className="font-mono bg-amber-100 px-1 rounded">{typeof window !== "undefined" ? window.location.origin : "https://yoursite.com"}/api/ticktick/oauth</span></li>
          <li>Salin <span className="font-bold">Client ID</span> dan <span className="font-bold">Client Secret</span> ke file <span className="font-mono">.env.local</span>.</li>
          <li>Klik tombol <span className="font-bold">Hubungkan</span> di atas untuk memulai otorisasi OAuth.</li>
          <li>Setelah terhubung, muat daftar project dan pilih tujuan task pesanan.</li>
        </ol>
      </div>
    </div>
  );
}
