import { NextRequest, NextResponse } from "next/server";
import {
  supabaseAdmin,
  getNotionSettings,
  buildNotionProperties,
  notionCreatePage,
  notionUpdatePage,
  NotionOrderData,
} from "../notion-helpers";

function parseFormData(raw: unknown): Record<string, unknown> {
  try {
    return typeof raw === "string" ? JSON.parse(raw) : (raw as Record<string, unknown> || {});
  } catch { return {}; }
}

function parsePackageName(raw: unknown): string {
  try {
    const sp = typeof raw === "string" ? JSON.parse(raw) : raw as any;
    return sp?.name || "";
  } catch { return ""; }
}

function toDateStr(val: unknown): string {
  if (!val) return "";
  const s = String(val).trim();
  if (!s) return "";
  const d = new Date(s);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

export async function POST(req: NextRequest) {
  const sb = supabaseAdmin();
  const settings = await getNotionSettings();

  if (!settings.enabled || !settings.token || !settings.projectsDbId) {
    return NextResponse.json({ error: "Notion belum dikonfigurasi atau dinonaktifkan" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");

  let query = sb
    .from("store_orders")
    .select("id, status, total_amount, form_data, selected_package, service_id, guest_name, guest_phone, order_number, created_at, notion_page_id, store_services(title)");

  if (month) {
    const [year, mon] = month.split("-").map(Number);
    const from = new Date(year, mon - 1, 1).toISOString();
    const to = new Date(year, mon, 1).toISOString();
    query = query.gte("created_at", from).lt("created_at", to);
  }

  const { data: orders, error } = await query.order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results = { synced: 0, created: 0, updated: 0, failed: 0 };

  for (const order of orders || []) {
    try {
      const fd = parseFormData(order.form_data);

      const data: NotionOrderData = {
        projectTitle: (fd["project_title"] || fd["Project Title"] || fd["Nama Logo"] || "") as string,
        clientName: (order.guest_name || fd["customer_name"] || fd["Client Name"] || "") as string,
        clientEmail: (fd["email"] || fd["customer_email"] || "") as string,
        whatsapp: (order.guest_phone || fd["whatsapp"] || "") as string,
        serviceTitle: (order.store_services as any)?.title || "",
        packageName: parsePackageName(order.selected_package),
        totalAmount: Number(order.total_amount || 0),
        discountAmount: Number(fd["discount_amount"] || 0),
        status: order.status,
        orderNumber: order.order_number,
        createdAt: order.created_at,
        finalFileUrl: (fd["final_file_url"] || fd["delivery_url"] || fd["file_url"] || "") as string,
        deadline: toDateStr(fd["deadline"]),
      };

      const properties = buildNotionProperties(data);

      if (order.notion_page_id) {
        const ok = await notionUpdatePage(settings.token, order.notion_page_id, properties);
        if (ok) { results.updated++; results.synced++; }
        else results.failed++;
      } else {
        const pageId = await notionCreatePage(settings.token, settings.projectsDbId, properties);
        if (pageId) {
          await sb.from("store_orders").update({ notion_page_id: pageId }).eq("id", order.id);
          results.created++;
          results.synced++;
        } else {
          results.failed++;
        }
      }
    } catch {
      results.failed++;
    }
  }

  await sb.from("app_settings").upsert({
    key: "notion_last_sync_projects_at",
    value: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  return NextResponse.json({
    success: true,
    ...results,
    message: `${results.synced} tersync (${results.created} baru, ${results.updated} diperbarui), ${results.failed} gagal.`,
  });
}
