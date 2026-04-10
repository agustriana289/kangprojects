"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ToastProvider";
import {
  Save, Loader2, Plus, Trash2, Eye, EyeOff,
  Mail, Globe, FileText, Send, X, Paperclip, ChevronDown,
  Star, Edit3, Users, Check, History, AlertCircle
} from "lucide-react";

function extractPlaceholders(html: string): string[] {
  const matches = html.match(/\{\{(\w+)\}\}/g) || [];
  return [...new Set(matches.map((m) => m.slice(2, -2)))];
}

type EmailDomain = {
  id: string;
  domain: string;
  display_name: string;
  is_default: boolean;
  created_at: string;
};

type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  body_html: string;
  created_at: string;
  updated_at: string;
};

type OrderSuggestion = {
  email: string;
  name: string;
  project: string;
  order_id: string;
  invoice: string;
  phone: string;
  service: string;
  package_name: string;
  total_amount: string;
};

const INPUT_CLASS =
  "bg-white border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary block w-full p-3 transition-all outline-none";
const LABEL_CLASS = "block mb-2 text-xs font-bold uppercase tracking-wider text-slate-700";
const SECTION_CLASS = "bg-white border border-slate-200 rounded-2xl p-6 shadow-sm";

type ActiveSection = "send" | "broadcast" | "templates" | "subscribers" | "settings" | "history";

type EmailLog = {
  id: string;
  type: "individual" | "broadcast";
  recipient_to: string;
  recipient_count: number;
  subject: string;
  template_name: string | null;
  from_domain: string | null;
  has_attachment: boolean;
  attachment_name: string | null;
  status: "success" | "failed";
  error_message: string | null;
  sent_at: string;
};

export default function EmailSettingsClient() {
  const supabase = createClient();
  const { showToast } = useToast();

  const [activeSection, setActiveSection] = useState<ActiveSection>("send");
  const [loading, setLoading] = useState(true);

  const [gmailAddress, setGmailAddress] = useState("");
  const [gmailPassword, setGmailPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [credentialSaving, setCredentialSaving] = useState(false);

  const [domains, setDomains] = useState<EmailDomain[]>([]);
  const [domainSaving, setDomainSaving] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [newDomainName, setNewDomainName] = useState("");

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [templateSaving, setTemplateSaving] = useState(false);
  const [isNewTemplate, setIsNewTemplate] = useState(false);

  const [isBroadcast, setIsBroadcast] = useState(false);
  const [sendTo, setSendTo] = useState("");
  const [sendFromId, setSendFromId] = useState("");
  const [sendTemplateId, setSendTemplateId] = useState("");
  const [sendPlaceholders, setSendPlaceholders] = useState<Record<string, string>>({});
  const [sendAttachment, setSendAttachment] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [emailNotification, setEmailNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [sending, setSending] = useState(false);
  const [projectSearch, setProjectSearch] = useState("");
  const [suggestions, setSuggestions] = useState<OrderSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filterSuggestions, setFilterSuggestions] = useState<OrderSuggestion[]>([]);
  const suggestRef = useRef<HTMLDivElement>(null);
  const suggestInputRef = useRef<HTMLInputElement>(null);
  const [dropdownTop, setDropdownTop] = useState(0);
  const [dropdownLeft, setDropdownLeft] = useState(0);
  const [dropdownWidth, setDropdownWidth] = useState(0);

  const [subscribers, setSubscribers] = useState<{ id: string; email: string; name: string }[]>([]);
  const [newSubscriberEmail, setNewSubscriberEmail] = useState("");
  const [newSubscriberName, setNewSubscriberName] = useState("");
  const [subscribersSaving, setSubscribersSaving] = useState(false);

  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<"all" | "individual" | "broadcast">("all");

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: settings }, { data: doms }, { data: tmpls }, { data: subs }] = await Promise.all([
      supabase.from("email_settings").select("gmail_address").eq("id", 1).single(),
      supabase.from("email_domains").select("*").order("created_at"),
      supabase.from("email_templates").select("*").order("created_at"),
      (async () => { try { const { data } = await supabase.from("email_subscribers").select("*").order("created_at", { ascending: false }); return { data: data || [] }; } catch { return { data: [] }; } })()
    ]);
    if (settings?.gmail_address) setGmailAddress(settings.gmail_address);
    setDomains(doms || []);
    setTemplates(tmpls || []);
    setSubscribers(subs || []);

    const { data: orders } = await supabase
      .from("store_orders")
      .select("id, order_number, form_data, guest_name, guest_phone, user_id, total_amount, selected_package, store_services(title), store_products(title)");
    const { data: users } = await supabase.from("users").select("id, full_name, email, phone");

    const userMap: Record<string, { full_name: string; email: string; phone?: string | null }> = {};
    (users || []).forEach((u) => { if (u.id) userMap[u.id] = u as any; });

    const seen = new Set<string>();
    const suggs: OrderSuggestion[] = [];
    (orders || []).forEach((o) => {
      let email = "";
      let name = "";
      let project = "";
      let phone = "";
      const invoice = o.order_number || "";
      const total = o.total_amount ? String(o.total_amount) : "";
      
      let package_name = "";
      if (typeof o.selected_package === "string") {
        try { package_name = JSON.parse(o.selected_package)?.name || ""; } catch {}
      } else if (o.selected_package && typeof o.selected_package === "object") {
        package_name = (o.selected_package as any)?.name || "";
      }

      const user = o.user_id ? userMap[o.user_id] : null;
      if (user?.email) email = user.email;
      if (user?.full_name) name = user.full_name;
      if (user?.phone) phone = user.phone;

      if (!email || !name || !phone || !project) {
        try {
          const fd = typeof o.form_data === "string" ? JSON.parse(o.form_data) : o.form_data || {};
          if (!email) email = fd.email || fd.customer_email || "";
          if (!name) name = fd.customer_name || fd["Client Name"] || o.guest_name || "";
          if (!phone) phone = fd.whatsapp || o.guest_phone || "";
          if (!project) project = fd.project_title || fd["Project Title"] || fd["Nama Logo"] || "";
        } catch {}
      }

      const svcTitle = ((o.store_services as any)?.title) || ((o.store_products as any)?.title) || "";
      if (!project) project = svcTitle;

      if (!seen.has(o.id)) {
        seen.add(o.id);
        suggs.push({
          email, name, project, order_id: o.id,
          invoice, phone, service: svcTitle, package_name, total_amount: total
        });
      }
    });
    setSuggestions(suggs);
    setLoading(false);
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    const { data } = await supabase
      .from("email_logs")
      .select("*")
      .order("sent_at", { ascending: false })
      .limit(100);
    setEmailLogs(data || []);
    setLogsLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    if (activeSection === "history") fetchLogs();
  }, [activeSection]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (suggestRef.current && !suggestRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const selectedTemplate = templates.find((t) => t.id === sendTemplateId);
    if (selectedTemplate) {
      const keys = extractPlaceholders(selectedTemplate.body_html + " " + selectedTemplate.subject);
      setSendPlaceholders((prev) => {
        const next: Record<string, string> = {};
        keys.forEach((k) => { next[k] = prev[k] || ""; });
        return next;
      });
    } else {
      setSendPlaceholders({});
    }
  }, [sendTemplateId, templates]);

  const handleSaveCredentials = async () => {
    if (!gmailAddress) { showToast("Masukkan alamat Gmail.", "error"); return; }
    setCredentialSaving(true);
    
    try {
      const res = await fetch("/api/email/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gmail_address: gmailAddress,
          gmail_app_password: gmailPassword || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan kredensial");
      
      showToast("Kredensial Gmail disimpan.", "success");
      setGmailPassword("");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Terjadi kesalahan", "error");
    } finally {
      setCredentialSaving(false);
    }
  };

  const handleAddDomain = async () => {
    if (!newDomain) { showToast("Masukkan domain.", "error"); return; }
    setDomainSaving(true);
    const { data, error } = await supabase.from("email_domains").insert({
      domain: newDomain,
      display_name: newDomainName || newDomain,
      is_default: domains.length === 0,
    }).select().single();
    if (error) showToast(error.message, "error");
    else { setDomains((prev) => [...prev, data]); setNewDomain(""); setNewDomainName(""); showToast("Domain ditambahkan.", "success"); }
    setDomainSaving(false);
  };

  const handleSetDefault = async (id: string) => {
    await supabase.from("email_domains").update({ is_default: false }).neq("id", "00000000-0000-0000-0000-000000000000");
    const { error } = await supabase.from("email_domains").update({ is_default: true }).eq("id", id);
    if (error) showToast(error.message, "error");
    else { setDomains((prev) => prev.map((d) => ({ ...d, is_default: d.id === id }))); showToast("Default domain diperbarui.", "success"); }
  };

  const handleDeleteDomain = async (id: string) => {
    if (!confirm("Hapus domain ini? Pastikan Anda tidak memerlukannya lagi.")) return;
    const { error } = await supabase.from("email_domains").delete().eq("id", id);
    if (error) showToast(error.message, "error");
    else { setDomains((prev) => prev.filter((d) => d.id !== id)); showToast("Domain dihapus.", "success"); }
  };

  const handleAddSubscriber = async () => {
    if (!newSubscriberEmail) return showToast("Email wajib diisi", "error");
    setSubscribersSaving(true);
    const { error, data } = await supabase.from("email_subscribers").insert({ email: newSubscriberEmail, name: newSubscriberName }).select("*").single();
    if (error) showToast(error.message, "error");
    else {
      showToast("Subscriber ditambahkan", "success");
      setSubscribers(prev => [data, ...prev]);
      setNewSubscriberEmail("");
      setNewSubscriberName("");
    }
    setSubscribersSaving(false);
  };

  const handleDeleteSubscriber = async (id: string) => {
    if (!confirm("Hapus subscriber ini?")) return;
    const { error } = await supabase.from("email_subscribers").delete().eq("id", id);
    if (error) showToast(error.message, "error");
    else {
      showToast("Subscriber dihapus", "success");
      setSubscribers(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;
    if (!editingTemplate.name || !editingTemplate.subject || !editingTemplate.body_html) {
      showToast("Nama, subjek, dan isi template harus diisi.", "error");
      return;
    }
    setTemplateSaving(true);
    if (isNewTemplate) {
      const { data, error } = await supabase.from("email_templates").insert({
        name: editingTemplate.name,
        subject: editingTemplate.subject,
        body_html: editingTemplate.body_html,
      }).select().single();
      if (error) showToast(error.message, "error");
      else { setTemplates((prev) => [...prev, data]); setEditingTemplate(null); setIsNewTemplate(false); showToast("Template disimpan.", "success"); }
    } else {
      const { error } = await supabase.from("email_templates").update({
        name: editingTemplate.name,
        subject: editingTemplate.subject,
        body_html: editingTemplate.body_html,
        updated_at: new Date().toISOString(),
      }).eq("id", editingTemplate.id);
      if (error) showToast(error.message, "error");
      else {
        setTemplates((prev) => prev.map((t) => (t.id === editingTemplate.id ? editingTemplate : t)));
        setEditingTemplate(null);
        showToast("Template diperbarui.", "success");
      }
    }
    setTemplateSaving(false);
  };

  const handleDeleteTemplate = async (id: string) => {
    const { error } = await supabase.from("email_templates").delete().eq("id", id);
    if (error) showToast(error.message, "error");
    else { setTemplates((prev) => prev.filter((t) => t.id !== id)); showToast("Template dihapus.", "success"); }
  };

  const handleSendEmail = async () => {
    const isBroadcast = activeSection === "broadcast";
    
    if (isBroadcast && subscribers.length === 0) {
      setEmailNotification({ type: "error", message: "Tidak ada subscriber. Tambahkan subscriber terlebih dahulu." });
      return;
    }
    if (!isBroadcast && !sendTo) {
      setEmailNotification({ type: "error", message: "Penerima email harus diisi." });
      return;
    }
    if (!sendTemplateId) {
      setEmailNotification({ type: "error", message: "Template harus dipilih." });
      return;
    }

    const toValue = isBroadcast ? subscribers.map(s => s.email).join(", ") : sendTo;
    setSending(true);
    setEmailNotification(null);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("to", toValue);
    formData.append("isBroadcast", isBroadcast ? "true" : "false");
    if (sendFromId) formData.append("fromDomainId", sendFromId);
    formData.append("templateId", sendTemplateId);
    formData.append("placeholders", JSON.stringify(sendPlaceholders));
    if (sendAttachment) formData.append("attachment", sendAttachment);

    try {
      // Use XMLHttpRequest untuk track upload progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Track upload progress
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 100);
            setUploadProgress(percentComplete);
          }
        });

        xhr.addEventListener("loadstart", () => {
          setUploadProgress(1);
        });

        xhr.addEventListener("load", () => {
          if (xhr.status === 200) {
            setUploadProgress(100);
            setEmailNotification({ 
              type: "success", 
              message: isBroadcast ? "Broadcast berhasil dikirim ke semua subscriber!" : "Email berhasil dikirim!" 
            });
            setTimeout(() => {
              setSendTo("");
              setSendFromId("");
              setSendTemplateId("");
              setSendPlaceholders({});
              setSendAttachment(null);
              setUploadProgress(0);
              setEmailNotification(null);
              setSending(false);
            }, 2000);
            resolve();
          } else {
            try {
              const response = JSON.parse(xhr.responseText);
              reject(new Error(response.error || `Error ${xhr.status}`));
            } catch {
              reject(new Error(`Gagal mengirim email (${xhr.status})`));
            }
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("Koneksi gagal. Periksa ukuran file (max 4MB)"));
        });

        xhr.addEventListener("abort", () => {
          reject(new Error("Upload dibatalkan"));
        });

        xhr.open("POST", "/api/email/send", true);
        xhr.send(formData);
      });
    } catch (err: any) {
      setEmailNotification({ type: "error", message: err.message || "Gagal mengirim email" });
      setSending(false);
      setUploadProgress(0);
    }
  };

  const handleProjectSearch = (val: string) => {
    setProjectSearch(val);
    const q = val.toLowerCase();
    const filtered = val
      ? suggestions.filter(
          (s) =>
            (s.email || "").toLowerCase().includes(q) ||
            (s.name || "").toLowerCase().includes(q) ||
            (s.project || "").toLowerCase().includes(q) ||
            (s.service || "").toLowerCase().includes(q) ||
            (s.invoice || "").toLowerCase().includes(q)
        )
      : suggestions;
    setFilterSuggestions(filtered.slice(0, 10));
    setShowSuggestions(true);
  };

  const openDropdown = () => {
    if (suggestInputRef.current) {
      const rect = suggestInputRef.current.getBoundingClientRect();
      setDropdownTop(rect.bottom + window.scrollY + 4);
      setDropdownLeft(rect.left + window.scrollX);
      setDropdownWidth(rect.width);
    }
    handleProjectSearch(projectSearch);
  };

  const selectSuggestion = (s: OrderSuggestion) => {
    const missingFields: string[] = [];
    if (!s.email) missingFields.push("Email");
    if (!s.name) missingFields.push("Nama Klien");
    if (!s.phone) missingFields.push("WhatsApp");
    if (!s.project && !s.service) missingFields.push("Nama Proyek/Layanan");

    if (missingFields.length > 0) {
      showToast(`Pesanan ini kehilangan data: ${missingFields.join(", ")}. Pengiriman mungkin gagal atau template tidak terisi sempurna.`, "error");
    }

    setSendTo(s.email || "");
    setProjectSearch(`${s.project || s.service || "-"} (${s.email || "Email Kosong"})`);
    setSendPlaceholders((prev) => ({
      ...prev,
      ...((s.name || s.email) ? { nama_klien: s.name || "", client_name: s.name || "", nama: s.name || "", name: s.name || "" } : {}),
      ...((s.project || s.service) ? { nama_proyek: s.project || "", project_name: s.project || "", project: s.project || "" } : {}),
      ...((s.email || s.name) ? { email_klien: s.email || "", email: s.email || "" } : {}),
      ...((s.phone || s.name) ? { no_hp: s.phone || "", phone: s.phone || "", whatsapp: s.phone || "" } : {}),
      ...(s.invoice ? { invoice: s.invoice, no_pesanan: s.invoice, order_id: s.invoice } : {}),
      ...(s.service ? { nama_layanan: s.service, service_name: s.service, layanan: s.service } : {}),
      ...(s.package_name ? { paket: s.package_name, package: s.package_name } : {}),
      ...(s.total_amount ? { total_harga: s.total_amount, total: s.total_amount } : {}),
    }));
    setShowSuggestions(false);
  };

  const SECTION_TABS: { key: ActiveSection; label: string; icon: React.ReactNode }[] = [
    { key: "send", label: "Kirim Email", icon: <Mail className="w-4 h-4" /> },
    { key: "broadcast", label: "Kirim Broadcast", icon: <Send className="w-4 h-4" /> },
    { key: "templates", label: "Template", icon: <FileText className="w-4 h-4" /> },
    { key: "subscribers", label: "Subscriber", icon: <Users className="w-4 h-4" /> },
    { key: "history", label: "Histori", icon: <History className="w-4 h-4" /> },
    { key: "settings", label: "Pengaturan", icon: <Globe className="w-4 h-4" /> },
  ];

  const currentTemplateKeys = editingTemplate
    ? extractPlaceholders(editingTemplate.body_html + " " + editingTemplate.subject)
    : [];


  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
      </div>
    );
  } 

  return (
    <div className="flex-1 bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl overflow-hidden flex flex-col xl:flex-row">
      <div className="w-full xl:w-64 shrink-0 bg-slate-50/50 border-b xl:border-b-0 xl:border-r border-slate-100 p-4 sm:p-6 overflow-x-auto">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 px-2">Pengaturan Email</h3>
        <nav className="flex xl:flex-col gap-2 min-w-max xl:min-w-0 pb-2">
          {SECTION_TABS.map((tab) => {
            const isActive = activeSection === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveSection(tab.key)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  isActive
                    ? "bg-white text-primary shadow-sm ring-1 ring-slate-200/50"
                    : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900"
                }`}
              >
                <span className={isActive ? "text-primary" : "text-slate-400"}>{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex-1 p-4 sm:p-6 lg:p-8 xl:p-10 overflow-auto">

        {activeSection === "settings" && (
          <div className="max-w-4xl space-y-8">
            {/* Kredensial Gmail Section */}
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight mb-1">Kredensial Gmail</h2>
                <p className="text-sm font-medium text-slate-500 mb-6 border-b border-slate-100 pb-4">
                  Konfigurasi akun Gmail dan App Password untuk pengiriman email. App Password dienkripsi sebelum disimpan ke database.
                </p>
              </div>
              <div className={SECTION_CLASS}>
                <div className="mb-4">
                  <label className={LABEL_CLASS}>Alamat Gmail</label>
                  <input
                    id="gmail_address"
                    type="email"
                    value={gmailAddress}
                    onChange={(e) => setGmailAddress(e.target.value)}
                    placeholder="your@gmail.com"
                    className={INPUT_CLASS}
                  />
                </div>
                <div className="mb-4">
                  <label className={LABEL_CLASS}>App Password Gmail</label>
                  <div className="relative">
                    <input
                      id="gmail_app_password"
                      type={showPassword ? "text" : "password"}
                      value={gmailPassword}
                      onChange={(e) => setGmailPassword(e.target.value)}
                      placeholder="Kosongkan jika tidak ingin mengubah"
                      className={INPUT_CLASS + " pr-10"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5 font-medium">
                    Buat App Password di: Google Account → Security → 2-Step Verification → App Passwords
                  </p>
                </div>
                <button
                  id="save_credentials_btn"
                  onClick={handleSaveCredentials}
                  disabled={credentialSaving}
                  className="inline-flex items-center gap-2 bg-primary text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60"
                >
                  {credentialSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Simpan Kredensial
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-200" />

            {/* Custom Domain Section */}
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight mb-1">Custom Sender Domain</h2>
                <p className="text-sm font-medium text-slate-500 mb-6 border-b border-slate-100 pb-4">
                  Daftar domain &quot;Send As&quot; yang sudah terdaftar di Gmail Settings → Send mail as. Email akan dikirim atas nama domain ini.
                </p>
              </div>
              <div className={SECTION_CLASS}>
                <h3 className="text-sm font-bold text-slate-900 mb-4">Tambah Domain Baru</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className={LABEL_CLASS}>Alamat Email Domain</label>
                    <input
                      id="new_domain_email"
                      type="email"
                      value={newDomain}
                      onChange={(e) => setNewDomain(e.target.value)}
                      placeholder="noreply@yourdomain.com"
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Nama Pengirim</label>
                    <input
                      id="new_domain_name"
                      type="text"
                      value={newDomainName}
                      onChange={(e) => setNewDomainName(e.target.value)}
                      placeholder="KangJasa Official"
                      className={INPUT_CLASS}
                    />
                  </div>
                </div>
                <button
                  id="add_domain_btn"
                  onClick={handleAddDomain}
                  disabled={domainSaving}
                  className="inline-flex items-center gap-2 bg-primary text-white font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60"
                >
                  {domainSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Tambah Domain
                </button>
              </div>

              <div className={SECTION_CLASS}>
                <h3 className="text-sm font-bold text-slate-900 mb-4">Daftar Domain ({domains.length})</h3>
                {domains.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs font-bold uppercase tracking-wider bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                    Belum ada domain yang dikonfigurasi.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {domains.map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 group hover:bg-white hover:border-slate-200 hover:shadow-sm transition-all"
                      >
                        <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{d.display_name || d.domain}</p>
                          <p className="text-xs text-slate-400 truncate">{d.domain}</p>
                        </div>
                        {d.is_default && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <Star className="w-3 h-3" /> Default
                          </span>
                        )}
                        {!d.is_default && (
                          <button
                            onClick={() => handleSetDefault(d.id)}
                            className="text-xs font-bold text-slate-500 hover:text-primary hover:bg-primary/10 px-2 py-1 rounded-lg transition-colors"
                          >
                            Set Default
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteDomain(d.id)}
                          className="p-1.5 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeSection === "templates" && (
          <div className="max-w-3xl space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight mb-1">Template Email</h2>
              <p className="text-sm font-medium text-slate-500 mb-6 border-b border-slate-100 pb-4">
                Buat dan edit template email dalam format HTML. Gunakan sintaks <code className="text-primary bg-primary/10 px-1 rounded text-xs font-mono">{`{{nama_variabel}}`}</code> untuk placeholder dinamis.
              </p>
            </div>

            {editingTemplate ? (
              <div className={SECTION_CLASS + " space-y-4"}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">{isNewTemplate ? "Template Baru" : "Edit Template"}</h3>
                  <button onClick={() => { setEditingTemplate(null); setIsNewTemplate(false); }} className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <label className={LABEL_CLASS}>Nama Template</label>
                  <input
                    id="template_name"
                    type="text"
                    value={editingTemplate.name}
                    onChange={(e) => setEditingTemplate((t) => t ? { ...t, name: e.target.value } : t)}
                    placeholder="Contoh: Konfirmasi Pesanan"
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Subject</label>
                  <input
                    id="template_subject"
                    type="text"
                    value={editingTemplate.subject}
                    onChange={(e) => setEditingTemplate((t) => t ? { ...t, subject: e.target.value } : t)}
                    placeholder="Contoh: Pesanan Anda #{{order_id}} telah dikonfirmasi"
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Isi HTML</label>
                  <textarea
                    id="template_body"
                    rows={14}
                    value={editingTemplate.body_html}
                    onChange={(e) => setEditingTemplate((t) => t ? { ...t, body_html: e.target.value } : t)}
                    placeholder={`<p>Halo {{nama_klien}},</p>\n<p>Terima kasih telah memesan {{nama_proyek}}.</p>`}
                    className={INPUT_CLASS + " font-mono text-xs resize-none h-60"}
                  />
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Daftar Variabel (Placeholder) yg Didukung</p>
                  <p className="text-[11px] text-slate-500 mb-2 leading-relaxed">
                    Gunakan penulisan variabel berikut di dalam <b>Subjek</b> atau <b>Isi HTML</b>. Jika sebuah Proyek dipilih pada saat Pengiriman, nilai-nilai ini akan ditarik secara otomatis dari pesanan (*Auto Fill).
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["{{nama_klien}}", "{{email_klien}}", "{{no_hp}}", "{{nama_proyek}}", "{{invoice}}", "{{nama_layanan}}", "{{paket}}", "{{total_harga}}"].map(v => (
                       <button 
                         type="button" 
                         onClick={() => {
                           navigator.clipboard.writeText(v);
                           showToast(v + " disalin!", "success");
                         }} 
                         key={v} 
                         className="bg-white border border-slate-200 text-primary font-mono text-[10px] px-2 py-1 rounded cursor-pointer hover:bg-primary/5 shadow-sm transition-colors" 
                         title="Klik untuk Salin"
                       >
                         {v}
                       </button>
                    ))}
                  </div>
                </div>

                {currentTemplateKeys.length > 0 && (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
                    <p className="text-xs font-bold text-primary mb-2 uppercase tracking-wider">Placeholder Spesifik Custom Terdeteksi</p>
                    <div className="flex flex-wrap gap-1.5">
                      {currentTemplateKeys.map((k) => (
                        <span key={k} className="inline-flex items-center text-xs font-mono bg-white border border-primary/20 text-primary px-2 py-0.5 rounded">
                          {`{{${k}}}`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <button
                    id="save_template_btn"
                    onClick={handleSaveTemplate}
                    disabled={templateSaving}
                    className="inline-flex items-center gap-2 bg-primary text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60"
                  >
                    {templateSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Simpan Template
                  </button>
                  <button
                    onClick={() => { setEditingTemplate(null); setIsNewTemplate(false); }}
                    className="text-sm font-bold text-slate-500 hover:text-slate-900 px-4 py-2.5 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-end">
                  <button
                    id="new_template_btn"
                    onClick={() => {
                      setIsNewTemplate(true);
                      setEditingTemplate({ id: "", name: "", subject: "", body_html: "", created_at: "", updated_at: "" });
                    }}
                    className="inline-flex items-center gap-2 bg-primary text-white font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Template Baru
                  </button>
                </div>

                {templates.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs font-bold uppercase tracking-wider bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                    Belum ada template email. Buat template pertama Anda.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {templates.map((t) => {
                      const placeholders = extractPlaceholders(t.body_html + " " + t.subject);
                      return (
                        <div key={t.id} className={SECTION_CLASS + " flex items-start gap-4"}>
                          <FileText className="w-5 h-5 text-slate-300 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 mb-0.5">{t.name}</p>
                            <p className="text-xs text-slate-500 mb-2 truncate">Subject: {t.subject}</p>
                            {placeholders.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {placeholders.map((k) => (
                                  <span key={k} className="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                                    {`{{${k}}}`}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => { setEditingTemplate(t); setIsNewTemplate(false); }}
                              className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTemplate(t.id)}
                              className="p-2 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeSection === "subscribers" && (
          <div className="max-w-3xl space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight mb-1">Daftar Subscriber Email</h2>
              <p className="text-sm font-medium text-slate-500 mb-6 border-b border-slate-100 pb-4">
                Kumpulan daftar subscriber yang nantinya akan digunakan secara serentak (otomatis) saat Anda memilih mode Kirim Email: Broadcast Promosi.
              </p>
            </div>
            
            <div className={SECTION_CLASS}>
              <h3 className="text-sm font-bold text-slate-900 mb-4">Tambah Subscriber Baru</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div>
                  <label className={LABEL_CLASS}>Nama (Opsional)</label>
                  <input
                    type="text"
                    value={newSubscriberName}
                    onChange={(e) => setNewSubscriberName(e.target.value)}
                    placeholder="Nama klien/pelanggan..."
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Email Address</label>
                  <input
                    type="email"
                    value={newSubscriberEmail}
                    onChange={(e) => setNewSubscriberEmail(e.target.value)}
                    placeholder="email@contoh.com"
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
              <button
                onClick={handleAddSubscriber}
                disabled={subscribersSaving || !newSubscriberEmail}
                className="inline-flex items-center gap-2 bg-primary text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {subscribersSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Tambahkan Subsciber
              </button>
            </div>

            <div className={`border border-slate-200 rounded-2xl overflow-hidden bg-white mt-6 ${subscribers.length === 0 ? "hidden" : ""}`}>
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4 rounded-tl-2xl">Nama</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4 text-right rounded-tr-2xl">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subscribers.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">{s.name || "-"}</td>
                      <td className="px-6 py-4 font-medium text-slate-600">{s.email}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteSubscriber(s.id)}
                          className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {subscribers.length === 0 && (
              <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl flex flex-col items-center justify-center py-16 text-slate-400">
                <Users className="w-10 h-10 text-slate-300 mb-3" />
                <p className="font-bold text-sm text-slate-500">Belum ada satupun daftar subscriber</p>
                <p className="text-xs mt-1">Tambahkan dari form di atas.</p>
              </div>
            )}
          </div>
        )}

        {activeSection === "send" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight mb-1">Kirim Email Individu</h2>
              <p className="text-sm font-medium text-slate-500 mb-6 border-b border-slate-100 pb-4">
                Kirim email ke satu klien menggunakan template yang sudah dikonfigurasi dengan attachment file.
              </p>
            </div>
            <div className={SECTION_CLASS + " space-y-5"}>
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

              <div className="bg-primary/5 p-4 rounded-xl border border-primary/20" ref={suggestRef}>
                <label className="block mb-2 text-xs font-bold uppercase tracking-wider text-primary">
                  Pilih Proyek / Pesanan (Opsional - Auto Fill)
                </label>
                <input
                  ref={suggestInputRef}
                  id="search_project"
                  type="text"
                  value={projectSearch}
                  onChange={(e) => handleProjectSearch(e.target.value)}
                  onFocus={openDropdown}
                  placeholder="Klik untuk menampilkan semua proyek, atau ketik untuk filter..."
                  className="bg-white border border-primary/20 text-slate-900 text-sm rounded-xl focus:ring-2 focus:ring-primary/40 focus:border-primary block w-full p-3 transition-all outline-none shadow-sm"
                  autoComplete="off"
                />
                {showSuggestions && filterSuggestions.length > 0 && createPortal(
                  <div
                    style={{ position: "fixed", top: dropdownTop, left: dropdownLeft, width: dropdownWidth, zIndex: 9999, maxHeight: "280px" }}
                    className="bg-white border border-slate-200 rounded-xl shadow-2xl overflow-y-auto"
                  >
                    {filterSuggestions.map((s) => (
                      <button
                        key={s.order_id}
                        onMouseDown={(e) => { e.preventDefault(); selectSuggestion(s); }}
                        className="flex items-center gap-3 w-full px-4 py-3 hover:bg-primary/5 text-left transition-colors border-b border-slate-50 last:border-0"
                      >
                        <FileText className="w-4 h-4 text-slate-300 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-slate-900 truncate">
                            {s.project || s.service || "—"}
                            {s.invoice && <span className="text-slate-400 font-normal ml-1 text-xs">#{s.invoice}</span>}
                          </p>
                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            {s.name || "(Tanpa nama)"} {s.email && <span className="text-slate-400">&middot; {s.email}</span>}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>,
                  document.body
                )}
                <p className="text-[11px] font-medium text-slate-500 mt-2 leading-relaxed">
                  Jika proyek dipilih, sistem akan otomatis mengisi field pengiriman dan mereplikasi semua nilai placeholder template.
                </p>
              </div>

              <div>
                <label className={LABEL_CLASS}>Penerima Email</label>
                <input
                  id="send_to"
                  type="email"
                  value={sendTo}
                  onChange={(e) => setSendTo(e.target.value)}
                  placeholder="email@klien.com"
                  className={INPUT_CLASS}
                  autoComplete="off"
                />
              </div>

              <div>
                <label className={LABEL_CLASS}>Kirim Dari</label>
                <div className="relative">
                  <select
                    id="send_from"
                    value={sendFromId}
                    onChange={(e) => setSendFromId(e.target.value)}
                    className={INPUT_CLASS + " appearance-none pr-8 cursor-pointer"}
                  >
                    <option value="">— Gunakan domain default —</option>
                    {domains.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.display_name || d.domain}{` <${d.domain}>`}{d.is_default ? " (Default)" : ""}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className={LABEL_CLASS}>Template</label>
                <div className="relative">
                  <select
                    id="send_template"
                    value={sendTemplateId}
                    onChange={(e) => setSendTemplateId(e.target.value)}
                    className={INPUT_CLASS + " appearance-none pr-8 cursor-pointer"}
                  >
                    <option value="">— Pilih template —</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className={LABEL_CLASS}>Lampiran (ZIP/RAR saja, max 4MB)</label>
                <div className="flex items-center gap-3">
                  <label
                    htmlFor="email_attachment"
                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-bold transition-all"
                  >
                    <Paperclip className="w-4 h-4" /> Pilih File
                    <input 
                      type="file" 
                      id="email_attachment" 
                      accept=".zip,.rar" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        const maxSize = 4 * 1024 * 1024; // 4MB
                        if (file && file.size > maxSize) {
                          const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
                          setEmailNotification({ 
                            type: "error", 
                            message: `File terlalu besar (${sizeMB}MB). Maksimal 4MB. Silakan kompres file Anda.` 
                          });
                          e.target.value = "";
                          setSendAttachment(null);
                        } else if (file) {
                          setSendAttachment(file);
                          setUploadProgress(0);
                          setEmailNotification(null);
                        }
                      }}
                    />
                  </label>
                  {sendAttachment && (
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-slate-600 truncate">{sendAttachment.name}</span>
                        <span className="text-[9px] font-bold text-slate-400">{uploadProgress}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-linear-to-r from-indigo-400 to-indigo-600 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  id="send_email_btn"
                  onClick={handleSendEmail}
                  disabled={sending || !sendTemplateId || !sendTo}
                  className="inline-flex items-center gap-2 bg-primary text-white font-bold text-sm px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {sending ? "Mengirim..." : "Kirim Email"}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSection === "broadcast" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight mb-1">Kirim Broadcast</h2>
              <p className="text-sm font-medium text-slate-500 mb-6 border-b border-slate-100 pb-4">
                Kirim email promosi ke semua subscriber daftar Anda menggunakan BCC untuk menjaga privasi.
              </p>
            </div>
            <div className={SECTION_CLASS + " space-y-5"}>
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

              <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl">
                <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2">Penerima Broadcast ({subscribers.length} Subscriber)</p>
                {subscribers.length === 0 ? (
                  <p className="text-sm text-slate-500 font-medium">Belum ada subscriber. Tambahkan subscriber terlebih dahulu di tab <span className="font-bold text-primary">Subscriber</span>.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                    {subscribers.map(s => (
                      <span key={s.id} className="inline-flex items-center gap-1 text-xs bg-white border border-primary/20 text-primary font-semibold px-2 py-1 rounded-lg">
                        <Users className="w-3 h-3" />
                        {s.name ? `${s.name} (${s.email})` : s.email}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-[11px] font-medium text-slate-500 mt-2 leading-relaxed">
                  Email akan dikirim via BCC ke semua subscriber di atas agar privasi terjaga.
                </p>
              </div>

              <div>
                <label className={LABEL_CLASS}>Kirim Dari</label>
                <div className="relative">
                  <select
                    id="send_from_broadcast"
                    value={sendFromId}
                    onChange={(e) => setSendFromId(e.target.value)}
                    className={INPUT_CLASS + " appearance-none pr-8 cursor-pointer"}
                  >
                    <option value="">— Gunakan domain default —</option>
                    {domains.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.display_name || d.domain}{` <${d.domain}>`}{d.is_default ? " (Default)" : ""}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className={LABEL_CLASS}>Template</label>
                <div className="relative">
                  <select
                    id="send_template_broadcast"
                    value={sendTemplateId}
                    onChange={(e) => setSendTemplateId(e.target.value)}
                    className={INPUT_CLASS + " appearance-none pr-8 cursor-pointer"}
                  >
                    <option value="">— Pilih template —</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className={LABEL_CLASS}>Lampiran (ZIP/RAR saja, max 4MB)</label>
                <div className="flex items-center gap-3">
                  <label
                    htmlFor="email_attachment_broadcast"
                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-bold transition-all"
                  >
                    <Paperclip className="w-4 h-4" /> Pilih File
                    <input 
                      type="file" 
                      id="email_attachment_broadcast" 
                      accept=".zip,.rar" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        const maxSize = 4 * 1024 * 1024; // 4MB
                        if (file && file.size > maxSize) {
                          const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
                          setEmailNotification({ 
                            type: "error", 
                            message: `File terlalu besar (${sizeMB}MB). Maksimal 4MB. Silakan kompres file Anda.` 
                          });
                          e.target.value = "";
                          setSendAttachment(null);
                        } else if (file) {
                          setSendAttachment(file);
                          setUploadProgress(0);
                          setEmailNotification(null);
                        }
                      }}
                    />
                  </label>
                  {sendAttachment && (
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-slate-600 truncate">{sendAttachment.name}</span>
                        <span className="text-[9px] font-bold text-slate-400">{uploadProgress}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-linear-to-r from-indigo-400 to-indigo-600 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  id="send_broadcast_btn"
                  onClick={handleSendEmail}
                  disabled={sending || !sendTemplateId || subscribers.length === 0}
                  className="inline-flex items-center gap-2 bg-primary text-white font-bold text-sm px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {sending ? "Mengirim..." : "Kirim Ke Semua Subscriber"}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSection === "history" && (
          <div className="max-w-4xl space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight mb-1">Histori Pengiriman Email</h2>
              <p className="text-sm font-medium text-slate-500 mb-6 border-b border-slate-100 pb-4">
                Riwayat semua email yang telah dikirim, baik individual maupun broadcast.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {(["all", "individual", "broadcast"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setHistoryFilter(f)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    historyFilter === f
                      ? "bg-primary text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {f === "all" && <History className="w-3.5 h-3.5" />}
                  {f === "individual" && <Mail className="w-3.5 h-3.5" />}
                  {f === "broadcast" && <Send className="w-3.5 h-3.5" />}
                  {f === "all" ? "Semua" : f === "individual" ? "Individu" : "Broadcast"}
                </button>
              ))}
              <button
                onClick={fetchLogs}
                disabled={logsLoading}
                className="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all disabled:opacity-60"
              >
                {logsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <History className="w-3.5 h-3.5" />}
                Refresh
              </button>
            </div>

            {logsLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (() => {
              const filtered = emailLogs.filter(log =>
                historyFilter === "all" ? true : log.type === historyFilter
              );
              if (filtered.length === 0) {
                return (
                  <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl flex flex-col items-center justify-center py-16 text-slate-400">
                    <History className="w-10 h-10 text-slate-300 mb-3" />
                    <p className="font-bold text-sm text-slate-500">Belum ada histori pengiriman</p>
                    <p className="text-xs mt-1">Email yang dikirim akan muncul di sini.</p>
                  </div>
                );
              }
              return (
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                      <tr>
                        <th className="px-5 py-4 rounded-tl-2xl">Tipe</th>
                        <th className="px-5 py-4">Penerima</th>
                        <th className="px-5 py-4">Subject</th>
                        <th className="px-5 py-4">Dari</th>
                        <th className="px-5 py-4">Status</th>
                        <th className="px-5 py-4 rounded-tr-2xl">Waktu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filtered.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-4">
                            {log.type === "broadcast" ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg">
                                <Send className="w-3 h-3" />
                                Broadcast
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-lg">
                                <Mail className="w-3 h-3" />
                                Individu
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-semibold text-slate-900 text-sm">{log.recipient_to}</p>
                            {log.type === "broadcast" && (
                              <p className="text-xs text-slate-400">{log.recipient_count} penerima</p>
                            )}
                            {log.has_attachment && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 mt-0.5">
                                <Paperclip className="w-2.5 h-2.5" />
                                {log.attachment_name || "Lampiran"}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-medium text-slate-700 text-xs max-w-48 truncate" title={log.subject}>{log.subject}</p>
                            {log.template_name && (
                              <p className="text-[10px] text-slate-400 mt-0.5 truncate">Template: {log.template_name}</p>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <p className="text-xs font-medium text-slate-600 truncate max-w-36" title={log.from_domain || ""}>
                              {log.from_domain || "—"}
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            {log.status === "success" ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg">
                                <Check className="w-3 h-3" />
                                Terkirim
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg" title={log.error_message || ""}>
                                <AlertCircle className="w-3 h-3" />
                                Gagal
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <p className="text-xs font-medium text-slate-700">
                              {new Date(log.sent_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {new Date(log.sent_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
