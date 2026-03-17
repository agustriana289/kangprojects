"use client";

import React, { useState, useEffect, useCallback } from "react";
import { LifeBuoy, Search, Loader2, ArrowRight, Calendar, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ToastProvider";
import Link from "next/link";
import { format } from "date-fns";

export default function AdminTicketsClient() {
  const supabase = createClient();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("support_tickets")
        .select(`*, user:users!user_id (full_name, email, avatar_url)`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setTickets(data || []);
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [supabase, showToast]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const filtered = tickets.filter(t =>
    t.subject.toLowerCase().includes(search.toLowerCase()) ||
    t.user?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="pt-6 px-4 pb-10">
      <div className="flex-1 bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl overflow-hidden">

        <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Tiket Bantuan</h2>
            <p className="text-sm font-medium text-slate-500 mt-0.5">Tinjau dan kelola semua permintaan bantuan klien</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Cari tiket atau klien..."
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary pl-10 pr-4 py-2.5 transition-all outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary opacity-30" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <LifeBuoy className="w-10 h-10 mb-3 opacity-20" strokeWidth={1.5} />
            <p className="text-xs font-bold uppercase tracking-wider">Tiket tidak ditemukan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Klien</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Subjek</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Prioritas</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Tanggal</th>
                  <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-primary font-bold text-xs shrink-0 overflow-hidden">
                          {t.user?.avatar_url
                            ? <img src={t.user.avatar_url} alt="" className="w-full h-full object-cover" />
                            : t.user?.full_name?.charAt(0).toUpperCase() || "?"
                          }
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{t.user?.full_name || "Tanpa Nama"}</p>
                          <p className="text-xs font-medium text-slate-400">{t.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-700 line-clamp-1">{t.subject}</p>
                      <p className="text-xs font-medium text-slate-400">#{t.id.slice(0, 8)}</p>
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={t.status} /></td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-lg inline-block ${
                        t.priority === "urgent" ? "bg-red-50 text-red-600" :
                        t.priority === "high" ? "bg-amber-50 text-amber-600" :
                        "bg-slate-100 text-slate-500"
                      }`}>{t.priority === "urgent" ? "Mendesak" : t.priority === "high" ? "Tinggi" : t.priority === "normal" ? "Normal" : t.priority === "low" ? "Rendah" : t.priority}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs font-medium">{format(new Date(t.created_at), "dd MMM yyyy")}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/dashboard/tickets/${t.id}`} className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:bg-indigo-50 px-3 py-2 rounded-lg transition-colors">
                        Kelola <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-100">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Menampilkan {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} dari {filtered.length} tiket
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
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    open: "bg-indigo-50 text-primary",
    in_progress: "bg-amber-50 text-amber-700",
    resolved: "bg-emerald-50 text-emerald-700",
    closed: "bg-slate-100 text-slate-500"
  };
  return (
    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase inline-block ${map[status] || "bg-slate-100 text-slate-500"}`}>
      {status === "open" ? "terbuka" : status === "in_progress" ? "diproses" : status === "resolved" ? "selesai" : status === "closed" ? "ditutup" : status?.replace("_", " ")}
    </span>
  );
}