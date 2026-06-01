import { NextRequest, NextResponse } from "next/server";
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
  const prices = (svc.packages || []).map((p) => Number(p.price || 0));
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;

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

export async function POST(req: NextRequest) {
  const sb = supabaseAdmin();
  const settings = await getNotionSettings();

  if (!settings.enabled || !settings.token || !settings.servicesDbId) {
    return NextResponse.json({ ok: false }, { status: 200 });
  }

  const { serviceId } = await req.json();
  if (!serviceId) return NextResponse.json({ error: "serviceId required" }, { status: 400 });

  const { data: svc, error } = await sb
    .from("store_services")
    .select("id, title, slug, description, category, packages, is_published, is_featured, notion_service_page_id")
    .eq("id", serviceId)
    .single();

  if (error || !svc) return NextResponse.json({ error: "Layanan tidak ditemukan" }, { status: 404 });

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
    await notionUpdatePage(settings.token, svc.notion_service_page_id, properties);
  } else {
    const pageId = await notionCreatePage(settings.token, settings.servicesDbId, properties);
    if (pageId) {
      await sb.from("store_services").update({ notion_service_page_id: pageId }).eq("id", serviceId);
    }
  }

  return NextResponse.json({ ok: true });
}
