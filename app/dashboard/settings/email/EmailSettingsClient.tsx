"use client";

import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ToastProvider";
import {
  Save, Loader2, Plus, Trash2, Eye, EyeOff,
  Mail, Globe, FileText, Send, X, Paperclip, ChevronDown,
  Star, Edit3
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

type ActiveSection = "credentials" | "domains" | "templates" | "send";

export default function EmailSettingsClient() {
  const supabase = createClient();
  const { showToast } = useToast();

  const [activeSection, setActiveSection] = useState<ActiveSection>("credentials");
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
  const [sending, setSending] = useState(false);
  const [suggestions, setSuggestions] = useState<OrderSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filterSuggestions, setFilterSuggestions] = useState<OrderSuggestion[]>([]);
  const suggestRef = useRef<HTMLDivElement>(null);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: settings }, { data: doms }, { data: tmpls }] = await Promise.all([
      supabase.from("email_settings").select("gmail_address").eq("id", 1).single(),
      supabase.from("email_domains").select("*").order("created_at"),
      supabase.from("email_templates").select("*").order("created_at"),
    ]);
    if (settings?.gmail_address) setGmailAddress(settings.gmail_address);
    setDomains(doms || []);
    setTemplates(tmpls || []);

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
      let invoice = o.order_number || "";
      let total = o.total_amount ? String(o.total_amount) : "";
      
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

      if (!email || !name || !phone) {
        try {
          const fd = typeof o.form_data === "string" ? JSON.parse(o.form_data) : o.form_data || {};
          if (!email && fd.email) email = fd.email;
          if (!name) name = fd.customer_name || fd["Client Name"] || o.guest_name || "";
          if (!phone) phone = fd.whatsapp || o.guest_phone || "";
          project = fd.project_title || fd["Project Title"] || fd["Nama Logo"] || "";
        } catch {}
      }

      const svcTitle = ((o.store_services as any)?.title) || ((o.store_products as any)?.title) || "";
      if (!project) project = svcTitle;

      if (email && !seen.has(email)) {
        seen.add(email);
        suggs.push({
          email, name, project, order_id: o.id,
          invoice, phone, service: svcTitle, package_name, total_amount: total
        });
      }
    });
    setSuggestions(suggs);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    const { error } = await supabase.from("email_domains").delete().eq("id", id);
    if (error) showToast(error.message, "error");
    else { setDomains((prev) => prev.filter((d) => d.id !== id)); showToast("Domain dihapus.", "success"); }
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
    if (!sendTo || !sendTemplateId) {
      showToast("Penerima dan template harus dipilih.", "error");
      return;
    }
    setSending(true);
    const formData = new FormData();
    formData.append("to", sendTo);
    formData.append("isBroadcast", isBroadcast ? "true" : "false");
    if (sendFromId) formData.append("fromDomainId", sendFromId);
    formData.append("templateId", sendTemplateId);
    formData.append("placeholders", JSON.stringify(sendPlaceholders));
    if (sendAttachment) formData.append("attachment", sendAttachment);

    const res = await fetch("/api/email/send", { method: "POST", body: formData });
    const json = await res.json();
    if (!res.ok) showToast(json.error || "Gagal mengirim email.", "error");
    else {
      showToast("Email berhasil dikirim!", "success");
      setSendTo("");
      setSendFromId("");
      setSendTemplateId("");
      setSendPlaceholders({});
      setSendAttachment(null);
    }
    setSending(false);
  };

  const handleToInput = (val: string) => {
    setSendTo(val);
    if (val.length >= 1) {
      const q = val.toLowerCase();
      setFilterSuggestions(suggestions.filter(
        (s) => s.email.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || s.project.toLowerCase().includes(q)
      ).slice(0, 8));
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (s: OrderSuggestion) => {
    setSendTo(s.email);
    setSendPlaceholders((prev) => ({
      ...prev,
      ...(s.name ? { nama_klien: s.name, client_name: s.name, nama: s.name, name: s.name } : {}),
      ...(s.project ? { nama_proyek: s.project, project_name: s.project, project: s.project } : {}),
      ...(s.email ? { email_klien: s.email, email: s.email } : {}),
      ...(s.phone ? { no_hp: s.phone, phone: s.phone, whatsapp: s.phone } : {}),
      ...(s.invoice ? { invoice: s.invoice, no_pesanan: s.invoice, order_id: s.invoice } : {}),
      ...(s.service ? { nama_layanan: s.service, service_name: s.service, layanan: s.service } : {}),
      ...(s.package_name ? { paket: s.package_name, package: s.package_name } : {}),
      ...(s.total_amount ? { total_harga: s.total_amount, total: s.total_amount } : {}),
    }));
    setShowSuggestions(false);
  };

  const SECTION_TABS: { key: ActiveSection; label: string; icon: React.ReactNode }[] = [
    { key: "credentials", label: "Kredensial Gmail", icon: <Mail className="w-4 h-4" /> },
    { key: "domains", label: "Custom Domain", icon: <Globe className="w-4 h-4" /> },
    { key: "templates", label: "Template Email", icon: <FileText className="w-4 h-4" /> },
    { key: "send", label: "Kirim Email", icon: <Send className="w-4 h-4" /> },
  ];

  const currentTemplateKeys = editingTemplate
    ? extractPlaceholders(editingTemplate.body_html + " " + editingTemplate.subject)
    : [];

  const sendTemplatePlaceholders = Object.keys(sendPlaceholders);

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

        {activeSection === "credentials" && (
          <div className="max-w-xl space-y-6">
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
        )}

        {activeSection === "domains" && (
          <div className="max-w-2xl space-y-6">
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
                {currentTemplateKeys.length > 0 && (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
                    <p className="text-xs font-bold text-primary mb-2 uppercase tracking-wider">Placeholder Terdeteksi</p>
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

        {activeSection === "send" && (
          <div className="max-w-2xl space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight mb-1">Kirim Email</h2>
              <p className="text-sm font-medium text-slate-500 mb-6 border-b border-slate-100 pb-4">
                Kirim email ke klien menggunakan template yang sudah dikonfigurasi. Lampiran ZIP/RAR diteruskan langsung tanpa disimpan ke server.
              </p>
            </div>
            <div className={SECTION_CLASS + " space-y-5"}>
              <div className="flex items-center gap-4 bg-slate-50 p-1.5 rounded-xl border border-slate-200 self-start">
                <button
                  type="button"
                  onClick={() => setIsBroadcast(false)}
                  className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${!isBroadcast ? 'bg-white shadow relative text-primary' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Individu / Proyek
                </button>
                <button
                  type="button"
                  onClick={() => setIsBroadcast(true)}
                  className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${isBroadcast ? 'bg-white shadow relative text-primary' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Broadcast Promosi
                </button>
              </div>

              {!isBroadcast && (
                <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 relative" ref={suggestRef}>
                  <label className="block mb-2 text-xs font-bold uppercase tracking-wider text-primary">
                    Pilih Proyek / Pesanan (Opsional - Auto Fill)
                  </label>
                  <input
                    id="search_project"
                    type="text"
                    onChange={(e) => handleToInput(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="Ketik email, nama klien, atau nama proyek untuk auto-fill data..."
                    className="bg-white border border-primary/20 text-slate-900 text-sm rounded-xl focus:ring-2 focus:ring-primary/40 focus:border-primary block w-full p-3 transition-all outline-none shadow-sm"
                    autoComplete="off"
                  />
                  {showSuggestions && filterSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                      {filterSuggestions.map((s) => (
                        <button
                          key={s.order_id}
                          onClick={() => selectSuggestion(s)}
                          className="flex items-center gap-3 w-full px-4 py-3 hover:bg-slate-50 text-left transition-colors border-b border-slate-50 last:border-0"
                        >
                          <FileText className="w-4 h-4 text-slate-300 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">
                              {s.project || s.service || "-"} {s.invoice ? <span className="text-slate-400 font-medium">#{s.invoice}</span> : ""}
                            </p>
                            <p className="text-xs text-slate-500 truncate mt-0.5">
                              {s.name || s.email} &middot; {s.email}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="text-[11px] font-medium text-slate-500 mt-2 leading-relaxed">
                    Jika proyek dipilih, sistem akan otomatis mengisi field pengiriman dan mereplikasi semua nilai placeholder template (seperti {'{{nama_klien}}'}, {'{{total_harga}}'}) yang tersedia.
                  </p>
                </div>
              )}

              <div>
                <label className={LABEL_CLASS}>{isBroadcast ? "Penerima Broadcast (BCC)" : "Penerima (To)"}</label>
                <input
                  id="send_to"
                  type="text"
                  value={sendTo}
                  onChange={(e) => setSendTo(e.target.value)}
                  placeholder={isBroadcast ? "email1@domain.com, email2@domain.com, ..." : "email@klien.com"}
                  className={INPUT_CLASS}
                  autoComplete="off"
                />
                {isBroadcast && (
                  <p className="text-[11px] font-medium text-slate-500 mt-1.5">
                    Mode Broadcast: Pisahkan banyak email sekaligus dengan tanda koma (,). Sistem akan mengirim via BCC agar privasi klien terjaga dan tidak saling melihat alamat penerima lainnya.
                  </p>
                )}
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

              {sendTemplatePlaceholders.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Isi Placeholder</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {sendTemplatePlaceholders.map((key) => (
                      <div key={key}>
                        <label className="block mb-1.5 text-xs font-bold text-slate-600 font-mono">{`{{${key}}}`}</label>
                        <input
                          id={`placeholder_${key}`}
                          type="text"
                          value={sendPlaceholders[key] || ""}
                          onChange={(e) => setSendPlaceholders((p) => ({ ...p, [key]: e.target.value }))}
                          placeholder={`Nilai untuk ${key}...`}
                          className="bg-white border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary block w-full p-2.5 transition-all outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className={LABEL_CLASS}>Lampiran (ZIP / RAR saja)</label>
                <div className="flex items-center gap-3">
                  <label
                    htmlFor="email_attachment"
                    className="inline-flex items-center gap-2 cursor-pointer bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
                  >
                    <Paperclip className="w-4 h-4" />
                    {sendAttachment ? sendAttachment.name : "Pilih File"}
                  </label>
                  <input
                    type="file"
                    id="email_attachment"
                    accept=".zip,.rar"
                    className="hidden"
                    onChange={(e) => setSendAttachment(e.target.files?.[0] || null)}
                  />
                  {sendAttachment && (
                    <button
                      onClick={() => setSendAttachment(null)}
                      className="p-1.5 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  id="send_email_btn"
                  onClick={handleSendEmail}
                  disabled={sending || !sendTo || !sendTemplateId}
                  className="inline-flex items-center gap-2 bg-primary text-white font-bold text-sm px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {sending ? "Mengirim..." : "Kirim Email"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
