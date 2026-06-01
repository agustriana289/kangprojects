import { NextResponse } from "next/server";
import {
  supabaseAdmin,
  getNotionSettings,
  buildNotionProperties,
  notionCreatePage,
  notionUpdatePage,
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

export async function POST() {
  const sb = supabaseAdmin();
  const settings = await getNotionSettings();

  if (!settings.enabled || !settings.token || !settings.marketDbId) {
    return NextResponse.json({ error: "Notion market belum dikonfigurasi atau dinonaktifkan" }, { status: 400 });
  }

  const { data: orders, error } = await sb
    .from("store_orders")
    .select("id, status, total_amount, form_data, selected_package, service_id, guest_name, guest_phone, order_number, created_at, notion_market_page_id, store_services(title)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results = { synced: 0, created: 0, updated: 0, failed: 0 };

  for (const order of orders || []) {
    try {
      const fd = parseFormData(order.form_data);
      const projectTitle = (fd["project_title"] || fd["Project Title"] || fd["Nama Logo"] || "") as string;
      const clientName = (order.guest_name || fd["customer_name"] || fd["Client Name"] || "") as string;
      const whatsapp = (order.guest_phone || fd["whatsapp"] || "") as string;
      const serviceTitle = (order.store_services as any)?.title || "";
      const packageName = parsePackageName(order.selected_package);
      const totalAmount = Number(order.total_amount || 0);

      const properties = buildNotionProperties(
        projectTitle, clientName, whatsapp, serviceTitle, packageName,
        totalAmount, order.status, order.order_number, order.created_at
      );

      if (order.notion_market_page_id) {
        const ok = await notionUpdatePage(settings.token, order.notion_market_page_id, properties);
        if (ok) { results.updated++; results.synced++; }
        else results.failed++;
      } else {
        const pageId = await notionCreatePage(settings.token, settings.marketDbId, properties);
        if (pageId) {
          await sb.from("store_orders").update({ notion_market_page_id: pageId }).eq("id", order.id);
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
    key: "notion_last_sync_market_at",
    value: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  return NextResponse.json({
    success: true,
    ...results,
    message: `${results.synced} tersync (${results.created} baru, ${results.updated} diperbarui), ${results.failed} gagal.`,
  });
}
