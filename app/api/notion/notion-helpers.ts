import { createClient } from "@supabase/supabase-js";

export function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function getNotionSettings(): Promise<{
  enabled: boolean;
  token: string | null;
  projectsDbId: string | null;
  marketDbId: string | null;
  servicesDbId: string | null;
}> {
  const sb = supabaseAdmin();
  const { data } = await sb
    .from("app_settings")
    .select("key, value")
    .in("key", ["notion_enabled", "notion_token", "notion_projects_db_id", "notion_market_db_id", "notion_services_db_id"]);

  const map: Record<string, string | null> = {};
  (data || []).forEach((r: { key: string; value: string | null }) => {
    map[r.key] = r.value;
  });

  return {
    enabled: map["notion_enabled"] === "true",
    token: map["notion_token"] || null,
    projectsDbId: map["notion_projects_db_id"] || null,
    marketDbId: map["notion_market_db_id"] || null,
    servicesDbId: map["notion_services_db_id"] || null,
  };
}

export type NotionOrderData = {
  projectTitle: string;
  clientName: string;
  clientEmail: string;
  whatsapp: string;
  serviceTitle: string;
  packageName: string;
  totalAmount: number;
  discountAmount: number;
  status: string;
  orderNumber: string;
  createdAt: string;
  finalFileUrl: string;
  deadline: string;
};

export function buildNotionProperties(d: NotionOrderData): Record<string, unknown> {
  const STATUS_NOTION: Record<string, string> = {
    pending: "No Status",
    waiting_payment: "Belum Dibayar",
    cancelled: "Dibatalkan",
    paid: "Dibayar",
    processing: "Dikerjakan",
    completed: "Selesai",
  };

  const props: Record<string, unknown> = {
    Proyek: { rich_text: [{ text: { content: d.projectTitle || "Tanpa Judul" } }] },
    "No Invoice": { title: [{ text: { content: d.orderNumber || "—" } }] },
    Klien: { rich_text: [{ text: { content: d.clientName || "—" } }] },
    Layanan: { rich_text: [{ text: { content: d.serviceTitle || "—" } }] },
    Package: { rich_text: [{ text: { content: d.packageName || "—" } }] },
    "Total Harga": { number: d.totalAmount },
    Discount: { number: d.discountAmount || 0 },
    Status: { select: { name: STATUS_NOTION[d.status] || "No Status" } },
    "Tanggal Masuk": { date: { start: d.createdAt ? d.createdAt.split("T")[0] : new Date().toISOString().split("T")[0] } },
  };

  if (d.whatsapp) props["WhatsApp"] = { phone_number: d.whatsapp };
  if (d.clientEmail) props["Email Klien"] = { email: d.clientEmail };
  if (d.finalFileUrl) props["File"] = { url: d.finalFileUrl };
  if (d.deadline) props["Deadline"] = { date: { start: d.deadline } };

  return props;
}


export async function notionCreatePage(
  token: string,
  databaseId: string,
  properties: Record<string, unknown>
): Promise<string | null> {
  const res = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
    },
    body: JSON.stringify({ parent: { database_id: databaseId }, properties }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.id ?? null;
}

export async function notionUpdatePage(
  token: string,
  pageId: string,
  properties: Record<string, unknown>
): Promise<boolean> {
  const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
    },
    body: JSON.stringify({ properties }),
  });
  return res.ok;
}

export async function notionVerifyDatabase(
  token: string,
  databaseId: string
): Promise<{ ok: boolean; title?: string; error?: string }> {
  const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": "2022-06-28",
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { ok: false, error: (err as any).message || `Error ${res.status}` };
  }
  const data = await res.json();
  const titleBlock = (data.title || []) as any[];
  const title = titleBlock.map((t: any) => t.plain_text || "").join("") || "Tanpa Nama";
  return { ok: true, title };
}
