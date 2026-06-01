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
  const d = new Date(String(val));
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

export async function POST(req: NextRequest) {
  const sb = supabaseAdmin();
  const settings = await getNotionSettings();

  if (!settings.enabled || !settings.token || !settings.marketDbId) {
    return NextResponse.json({ ok: false }, { status: 200 });
  }

  const { orderId } = await req.json();
  if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });

  const { data: order, error } = await sb
    .from("store_orders")
    .select("id, status, total_amount, form_data, selected_package, guest_name, guest_phone, order_number, created_at, notion_market_page_id, store_services(title)")
    .eq("id", orderId)
    .single();

  if (error || !order) return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });

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

  if (order.notion_market_page_id) {
    await notionUpdatePage(settings.token, order.notion_market_page_id, properties);
  } else {
    const pageId = await notionCreatePage(settings.token, settings.marketDbId, properties);
    if (pageId) {
      await sb.from("store_orders").update({ notion_market_page_id: pageId }).eq("id", orderId);
    }
  }

  return NextResponse.json({ ok: true });
}
