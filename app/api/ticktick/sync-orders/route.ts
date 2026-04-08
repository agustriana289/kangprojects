import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const EXCLUDED_STATUSES = ["completed", "cancelled"];

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getSetting(key: string): Promise<string | null> {
  const sb = supabaseAdmin();
  const { data } = await sb.from("app_settings").select("value").eq("key", key).single();
  return data?.value ?? null;
}

async function getValidAccessToken(): Promise<string | null> {
  const enabled = await getSetting("ticktick_enabled");
  if (enabled !== "true") return null;
  const token = await getSetting("ticktick_access_token");
  return token;
}

async function createTickTickTask(
  accessToken: string,
  projectId: string | null,
  title: string,
  content?: string
): Promise<string | null> {
  const payload: Record<string, unknown> = { title };
  if (content) payload.content = content;
  if (projectId) payload.projectId = projectId;

  const res = await fetch("https://api.ticktick.com/open/v1/task", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data.id ?? null;
}

export async function POST() {
  const sb = supabaseAdmin();

  const accessToken = await getValidAccessToken();
  if (!accessToken) {
    return NextResponse.json({ error: "TickTick not connected" }, { status: 400 });
  }

  const projectId = await getSetting("ticktick_project_id");

  const { data: orders, error } = await sb
    .from("store_orders")
    .select("id, status, total_amount, form_data, selected_package, service_id, guest_name, guest_phone, ticktick_task_id, store_services(title)")
    .not("status", "in", `(${EXCLUDED_STATUSES.map(s => `"${s}"`).join(",")})`)
    .is("ticktick_task_id", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results = { exported: 0, skipped: 0, failed: 0 };

  for (const order of orders || []) {
    try {
      const fd = (() => {
        try {
          return typeof order.form_data === "string"
            ? JSON.parse(order.form_data)
            : (order.form_data as Record<string, unknown> || {});
        } catch { return {}; }
      })();

      const projectTitle = (fd["project_title"] || fd["Project Title"] || fd["Nama Logo"] || "") as string;
      const clientName = (order.guest_name || fd["customer_name"] || fd["Client Name"] || "") as string;
      const whatsapp = (order.guest_phone || fd["whatsapp"] || "") as string;
      const svcTitle = (order.store_services as any)?.title || "";
      const pkgName = (() => {
        try {
          const sp = typeof order.selected_package === "string"
            ? JSON.parse(order.selected_package)
            : order.selected_package as any;
          return sp?.name || "";
        } catch { return ""; }
      })();
      const total = Number(order.total_amount || 0);

      const title = `📋 ${projectTitle || clientName || order.id}`;
      const content = [
        clientName && `Klien: ${clientName}`,
        whatsapp && `WhatsApp: ${whatsapp}`,
        svcTitle && `Layanan: ${svcTitle}${pkgName ? ` - ${pkgName}` : ""}`,
        total > 0 && `Total: Rp ${total.toLocaleString("id-ID")}`,
        `Status: ${order.status}`,
      ].filter(Boolean).join("\n");

      const taskId = await createTickTickTask(accessToken, projectId, title, content);

      if (taskId) {
        await sb.from("store_orders").update({ ticktick_task_id: taskId }).eq("id", order.id);
        results.exported++;
      } else {
        results.failed++;
      }
    } catch {
      results.failed++;
    }
  }

  return NextResponse.json({
    success: true,
    ...results,
    message: `${results.exported} pesanan diekspor, ${results.skipped} dilewati, ${results.failed} gagal.`,
  });
}
