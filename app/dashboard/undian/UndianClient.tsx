"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ToastProvider";
import {
  Trophy, Users, Mail, Shuffle, Loader2, RotateCcw,
  Copy, CheckCircle2, Sparkles, Gift, Plus, Trash2,
  History, UserPlus, X, Phone, ChevronDown, ChevronUp
} from "lucide-react";

type Source = "subscribers" | "customers" | "custom";

type Participant = {
  id: string;
  name: string;
  email?: string;
  whatsapp?: string;
  source: Source;
};

type Winner = Participant;

type HistoryRecord = {
  id: string;
  source: string;
  winner_count: number;
  total_participants: number;
  winners: Winner[];
  drawn_at: string;
};

const SPIN_DURATION = 3000;
const SPIN_INTERVAL = 60;

const SOURCE_LABELS: Record<Source, string> = {
  subscribers: "Subscriber Email",
  customers: "Pelanggan Proyek",
  custom: "Peserta Manual",
};

export default function UndianClient() {
  const supabase = createClient();
  const { showToast } = useToast();

  const [source, setSource] = useState<Source>("subscribers");
  const [winnerCount, setWinnerCount] = useState(1);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [phase, setPhase] = useState<"idle" | "spinning" | "done">("idle");
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [savingHistory, setSavingHistory] = useState(false);

  const [customName, setCustomName] = useState("");
  const [customEmail, setCustomEmail] = useState("");
  const [customWa, setCustomWa] = useState("");
  const [customParticipants, setCustomParticipants] = useState<Participant[]>([]);

  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);

  const spinTimerRef = useRef<NodeJS.Timeout | null>(null);
  const doneTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchParticipants = useCallback(async () => {
    if (source === "custom") {
      setParticipants(customParticipants);
      return;
    }
    setLoadingParticipants(true);
    try {
      if (source === "subscribers") {
        const { data, error } = await supabase.from("email_subscribers").select("id, name, email, whatsapp");
        if (error) throw error;
        setParticipants((data || []).map((d) => ({
          id: d.id, name: d.name || d.email, email: d.email,
          whatsapp: d.whatsapp || undefined, source: "subscribers",
        })));
      } else {
        const { data: orders, error } = await supabase
          .from("store_orders")
          .select("id, form_data, guest_name, guest_phone, user_id");
        if (error) throw error;
        const { data: users } = await supabase.from("users").select("id, full_name, email, phone");
        const userMap: Record<string, { full_name: string; email: string; phone?: string | null }> = {};
        (users || []).forEach((u) => { if (u.id) userMap[u.id] = u as any; });
        const seen = new Set<string>();
        const list: Participant[] = [];
        (orders || []).forEach((o) => {
          let name = ""; let email = ""; let phone = "";
          const user = o.user_id ? userMap[o.user_id] : null;
          if (user) { name = user.full_name; email = user.email; phone = user.phone || ""; }
          if (!name || !email) {
            try {
              const fd = typeof o.form_data === "string" ? JSON.parse(o.form_data) : o.form_data || {};
              if (!email) email = fd.email || fd.customer_email || "";
              if (!name) name = fd.customer_name || fd["Client Name"] || o.guest_name || "";
              if (!phone) phone = fd.whatsapp || o.guest_phone || "";
            } catch {}
          }
          const key = email || o.id;
          if (!seen.has(key)) {
            seen.add(key);
            list.push({ id: o.id, name: name || email || "Tidak Dikenal", email, whatsapp: phone || undefined, source: "customers" });
          }
        });
        setParticipants(list);
      }
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLoadingParticipants(false);
    }
  }, [source, supabase, showToast]);

  useEffect(() => {
    if (source !== "custom") fetchParticipants();
    else setParticipants(customParticipants);
  }, [source]);

  useEffect(() => {
    if (source === "custom") setParticipants(customParticipants);
  }, [customParticipants]);

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from("undian_history")
        .select("*")
        .order("drawn_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      setHistory(data || []);
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLoadingHistory(false);
    }
  }, [supabase, showToast]);

  useEffect(() => {
    if (showHistory) fetchHistory();
  }, [showHistory]);

  const addCustomParticipant = () => {
    if (!customName.trim()) { showToast("Nama peserta wajib diisi.", "error"); return; }
    const newP: Participant = {
      id: `custom-${Date.now()}-${Math.random()}`,
      name: customName.trim(),
      email: customEmail.trim() || undefined,
      whatsapp: customWa.trim() || undefined,
      source: "custom",
    };
    setCustomParticipants((prev) => [...prev, newP]);
    setCustomName(""); setCustomEmail(""); setCustomWa("");
  };

  const removeCustomParticipant = (id: string) => {
    setCustomParticipants((prev) => prev.filter((p) => p.id !== id));
  };

  const saveHistory = async (picked: Winner[], total: number) => {
    setSavingHistory(true);
    try {
      await supabase.from("undian_history").insert({
        source,
        winner_count: picked.length,
        total_participants: total,
        winners: picked,
      });
    } catch (err: any) {
      showToast("Gagal menyimpan histori: " + err.message, "error");
    } finally {
      setSavingHistory(false);
    }
  };

  const startDraw = () => {
    const pool = source === "custom" ? customParticipants : participants;
    if (pool.length === 0) { showToast("Tidak ada peserta.", "error"); return; }
    if (winnerCount > pool.length) {
      showToast(`Jumlah pemenang (${winnerCount}) melebihi peserta (${pool.length}).`, "error"); return;
    }
    setWinners([]); setPhase("spinning"); setSpinning(true);
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, winnerCount);
    spinTimerRef.current = setInterval(() => {
      const rnd = pool[Math.floor(Math.random() * pool.length)];
      setDisplayName(rnd.name);
    }, SPIN_INTERVAL);
    doneTimerRef.current = setTimeout(() => {
      if (spinTimerRef.current) clearInterval(spinTimerRef.current);
      setSpinning(false);
      setWinners(picked);
      setDisplayName(picked[0].name);
      setPhase("done");
      saveHistory(picked, pool.length);
    }, SPIN_DURATION);
  };

  const reset = () => {
    if (spinTimerRef.current) clearInterval(spinTimerRef.current);
    if (doneTimerRef.current) clearTimeout(doneTimerRef.current);
    setWinners([]); setPhase("idle"); setDisplayName("");
  };

  const copyWinner = (idx: number) => {
    const w = winners[idx];
    const text = [w.name, w.email, w.whatsapp ? `WA: ${w.whatsapp}` : ""].filter(Boolean).join(" | ");
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const activePool = source === "custom" ? customParticipants : participants;
  const inputClass = "bg-white border border-slate-200 text-slate-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-secondary p-3 transition-all outline-none w-full";
  const labelClass = "block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2";

  return (
    <div className="pt-6 px-4 pb-16 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Modul Undian</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Pilih pemenang secara acak dari daftar peserta.</p>
        </div>
        <button
          onClick={() => setShowHistory((v) => !v)}
          className="inline-flex items-center gap-2 border border-slate-200 text-slate-600 text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
        >
          <History className="w-4 h-4" />
          Riwayat Undian
          {showHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {showHistory && (
        <div className="mb-8 bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Riwayat Undian</h2>
            <button onClick={fetchHistory} className="text-xs font-bold text-primary hover:underline">Refresh</button>
          </div>
          {loadingHistory ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">Belum ada riwayat undian.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {history.map((h) => (
                <div key={h.id} className="px-6 py-4">
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedHistory(expandedHistory === h.id ? null : h.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          {h.winner_count} Pemenang <span className="text-slate-400 font-medium">dari {h.total_participants} peserta</span>
                        </p>
                        <p className="text-xs text-slate-400">
                          {SOURCE_LABELS[h.source as Source] || h.source} · {new Date(h.drawn_at).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                    {expandedHistory === h.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                  {expandedHistory === h.id && (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 pl-12">
                      {(h.winners || []).map((w, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
                          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-white text-xs font-extrabold shrink-0">
                            #{idx + 1}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">{w.name}</p>
                            {w.email && <p className="text-xs text-slate-500 truncate">{w.email}</p>}
                            {w.whatsapp && <p className="text-xs text-emerald-600 truncate">WA: {w.whatsapp}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-5">
          <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl p-6 space-y-5">
            <div>
              <label className={labelClass}>Sumber Peserta</label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { val: "subscribers", label: "Subscriber", icon: Mail },
                  { val: "customers", label: "Pelanggan", icon: Users },
                  { val: "custom", label: "Manual", icon: UserPlus },
                ] as { val: Source; label: string; icon: any }[]).map(({ val, label, icon: Icon }) => (
                  <button
                    key={val}
                    onClick={() => { setSource(val); reset(); }}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-[11px] font-bold transition-all ${
                      source === val ? "border-primary bg-indigo-50 text-primary" : "border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {source === "custom" && (
              <div className="space-y-3 pt-1">
                <label className={labelClass + " mb-1"}>Tambah Peserta Manual</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Nama peserta *"
                  className={inputClass}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomParticipant(); } }}
                />
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="email"
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      placeholder="Email (opsional)"
                      className={inputClass + " pl-9 text-xs"}
                    />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="tel"
                      value={customWa}
                      onChange={(e) => setCustomWa(e.target.value)}
                      placeholder="WhatsApp (opsional)"
                      className={inputClass + " pl-9 text-xs"}
                    />
                  </div>
                </div>
                <button
                  onClick={addCustomParticipant}
                  className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors"
                >
                  <Plus className="w-4 h-4" /> Tambah ke Daftar
                </button>
              </div>
            )}

            <div>
              <label className={labelClass}>Jumlah Pemenang</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setWinnerCount((n) => Math.max(1, n - 1))}
                  className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 text-lg font-bold transition-colors"
                >−</button>
                <input
                  type="number" min={1} max={activePool.length || 999}
                  value={winnerCount}
                  onChange={(e) => setWinnerCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className={`${inputClass} text-center text-xl font-extrabold`}
                />
                <button
                  onClick={() => setWinnerCount((n) => n + 1)}
                  className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 text-lg font-bold transition-colors"
                >+</button>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl px-4 py-3 flex items-center justify-between border border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Peserta</span>
              {loadingParticipants ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
              ) : (
                <span className="text-lg font-extrabold text-slate-900">{activePool.length}</span>
              )}
            </div>

            <button
              onClick={startDraw}
              disabled={spinning || loadingParticipants || activePool.length === 0}
              className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-secondary text-white text-sm font-bold px-6 py-3.5 rounded-xl shadow-md shadow-indigo-200 transition-colors disabled:opacity-60"
            >
              {spinning ? <><Loader2 className="w-4 h-4 animate-spin" />Mengundi...</> : <><Shuffle className="w-4 h-4" />Mulai Undian</>}
            </button>

            {phase !== "idle" && (
              <button
                onClick={reset}
                disabled={spinning}
                className="w-full inline-flex items-center justify-center gap-2 border border-slate-200 text-slate-600 text-sm font-bold px-6 py-3 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-60"
              >
                <RotateCcw className="w-4 h-4" />Ulangi Undian
              </button>
            )}
          </div>

          <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl p-4 max-h-72 overflow-y-auto">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Daftar Peserta ({activePool.length})
            </p>
            {loadingParticipants ? (
              <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
            ) : activePool.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                {source === "custom" ? "Belum ada peserta. Tambahkan di atas." : "Tidak ada peserta."}
              </p>
            ) : (
              <ul className="space-y-1">
                {activePool.map((p) => (
                  <li key={p.id} className="text-xs text-slate-600 px-2 py-1.5 rounded-lg hover:bg-slate-50 flex items-center gap-2 transition-colors group">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400 shrink-0">
                      {(p.name || "?")[0].toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-800 truncate">{p.name}</p>
                      {p.email && <p className="text-slate-400 truncate">{p.email}</p>}
                    </div>
                    {source === "custom" && (
                      <button
                        onClick={() => removeCustomParticipant(p.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-rose-400 hover:text-rose-600 transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl p-8 min-h-[500px] flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/40 via-white to-purple-50/40 pointer-events-none" />

            {phase === "idle" && (
              <div className="relative text-center">
                <div className="w-24 h-24 rounded-full bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center mx-auto mb-6">
                  <Gift className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-xl font-extrabold text-slate-700 mb-2">Siap Mengundi</h2>
                <p className="text-sm text-slate-400">Pilih sumber, tambah peserta jika manual, tentukan jumlah pemenang, lalu klik <b>Mulai Undian</b>.</p>
              </div>
            )}

            {phase === "spinning" && (
              <div className="relative text-center w-full">
                <div className="flex items-center justify-center gap-2 mb-6">
                  <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Mengundi...</span>
                  <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                </div>
                <div className="relative bg-gradient-to-br from-primary to-secondary rounded-3xl p-10 mx-auto max-w-sm shadow-2xl shadow-indigo-300">
                  <div className="absolute -top-3 -right-3">
                    <div className="w-8 h-8 rounded-full bg-amber-400 animate-bounce flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <p className="text-white text-2xl font-extrabold text-center break-words" style={{ minHeight: "3rem" }}>
                    {displayName || "..."}
                  </p>
                </div>
                <div className="mt-6 flex justify-center gap-1">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}

            {phase === "done" && winners.length > 0 && (
              <div className="relative w-full">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-1.5 mb-3">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-bold text-amber-700">{winners.length} Pemenang Terpilih!</span>
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900">
                    Selamat kepada Pemenang 🎉
                    {savingHistory && <span className="text-xs text-slate-400 font-normal ml-2">(menyimpan...)</span>}
                  </h2>
                </div>
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {winners.map((w, idx) => (
                    <div key={w.id} className="flex items-center gap-4 bg-gradient-to-r from-indigo-50 to-white border border-indigo-100 rounded-2xl p-4 shadow-sm">
                      <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-extrabold text-sm shrink-0 shadow-md shadow-indigo-200">
                        #{idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-extrabold text-slate-900 text-sm truncate">{w.name}</p>
                        {w.email && <p className="text-xs text-slate-500 truncate">{w.email}</p>}
                        {w.whatsapp && <p className="text-xs text-emerald-600 font-medium truncate">WA: {w.whatsapp}</p>}
                      </div>
                      <button
                        onClick={() => copyWinner(idx)}
                        className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-primary hover:border-primary/30 transition-colors shrink-0"
                        title="Salin data pemenang"
                      >
                        {copiedIdx === idx ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
