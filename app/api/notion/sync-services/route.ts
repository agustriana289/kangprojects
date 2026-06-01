import { NextResponse } from "next/server";
import {
  supabaseAdmin,
  getNotionSettings,
  notionCreatePage,
  notionUpdatePage,
} from "../notion-helpers";

function buildServiceProperties(svc: {
  title: string;
  category: string;
  description: string;
  slug: string;
  is_published: boolean;
  is_featured: boolean;
  packages: { name: string; price: number; description: string }[];
}): Record<string, unknown> {
  const packageList = (svc.packages || [])
    .map((p) => `${p.name}: Rp ${Number(p.price || 0).toLocaleString("id-ID")}`)
    .join("\n");

  const minPrice = svc.packages?.length
    ? Math.min(...svc.packages.map((p) => Number(p.price || 0)))
    : 0;
  const maxPrice = svc.packages?.length
    ? Math.max(...svc.packages.map((p) => Number(p.price || 0)))
    : 0;

  return {
    Layanan: { title: [{ text: { content: svc.title || "Tanpa Judul" } }] },
    Kategori: { select: { name: svc.category || "Lainnya" } },
    Deskripsi: { rich_text: [{ text: { content: (svc.description || "").slice(0, 2000) } }] },
    Slug: { rich_text: [{ text: { content: svc.slug || "" } }] },
    "Harga Mulai": { number: minPrice },
    "Harga Tertinggi": { number: maxPrice },
    "Jumlah Paket": { number: svc.packages?.length || 0 },
    "Detail Paket": { rich_text: [{ text: { content: packageList.slice(0, 2000) } }] },
    Status: { select: { name: svc.is_published ? "Diterbitkan" : "Draf" } },
    Unggulan: { checkbox: svc.is_featured },
  };
}

export async function POST() {
  const sb = supabaseAdmin();
  const settings = await getNotionSettings();

  if (!settings.enabled || !settings.token || !settings.servicesDbId) {
    return NextResponse.json({ error: "Notion services belum dikonfigurasi atau dinonaktifkan" }, { status: 400 });
  }

  const { data: services, error } = await sb
    .from("store_services")
    .select("id, title, slug, description, category, packages, is_published, is_featured, notion_service_page_id")
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results = { synced: 0, created: 0, updated: 0, failed: 0 };

  for (const svc of services || []) {
    try {
      const properties = buildServiceProperties({
        title: svc.title,
        category: svc.category,
        description: svc.description,
        slug: svc.slug,
        is_published: svc.is_published,
        is_featured: svc.is_featured,
        packages: svc.packages || [],
      });

      if (svc.notion_service_page_id) {
        const ok = await notionUpdatePage(settings.token, svc.notion_service_page_id, properties);
        if (ok) { results.updated++; results.synced++; }
        else results.failed++;
      } else {
        const pageId = await notionCreatePage(settings.token, settings.servicesDbId, properties);
        if (pageId) {
          await sb.from("store_services").update({ notion_service_page_id: pageId }).eq("id", svc.id);
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
    key: "notion_last_sync_services_at",
    value: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  return NextResponse.json({
    success: true,
    ...results,
    message: `${results.synced} layanan tersync (${results.created} baru, ${results.updated} diperbarui), ${results.failed} gagal.`,
  });
}
