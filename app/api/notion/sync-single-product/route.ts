import { NextRequest, NextResponse } from "next/server";
import {
  supabaseAdmin,
  getNotionSettings,
  notionCreatePage,
  notionUpdatePage,
} from "../notion-helpers";

function buildProductProperties(prd: {
  title: string;
  category: string;
  description: string;
  slug: string;
  is_published: boolean;
  packages: { name: string; price: number; description: string }[];
}): Record<string, unknown> {
  const packageList = (prd.packages || [])
    .map((p) => `${p.name}: Rp ${Number(p.price || 0).toLocaleString("id-ID")}`)
    .join("\n");
  const prices = (prd.packages || []).map((p) => Number(p.price || 0));
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;

  return {
    Produk: { title: [{ text: { content: prd.title || "Tanpa Judul" } }] },
    Kategori: { select: { name: prd.category || "Lainnya" } },
    Deskripsi: { rich_text: [{ text: { content: (prd.description || "").slice(0, 2000) } }] },
    Slug: { rich_text: [{ text: { content: prd.slug || "" } }] },
    "Harga Mulai": { number: minPrice },
    "Harga Tertinggi": { number: maxPrice },
    "Jumlah Paket": { number: prd.packages?.length || 0 },
    "Detail Paket": { rich_text: [{ text: { content: packageList.slice(0, 2000) } }] },
    Status: { select: { name: prd.is_published ? "Diterbitkan" : "Draf" } },
  };
}

export async function POST(req: NextRequest) {
  const sb = supabaseAdmin();
  const settings = await getNotionSettings();

  if (!settings.enabled || !settings.token || !settings.marketDbId) {
    return NextResponse.json({ ok: false }, { status: 200 });
  }

  const { productId } = await req.json();
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });

  const { data: prd, error } = await sb
    .from("store_products")
    .select("id, title, slug, description, category, packages, is_published, notion_market_page_id")
    .eq("id", productId)
    .single();

  if (error || !prd) return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });

  const properties = buildProductProperties({
    title: prd.title,
    category: prd.category,
    description: prd.description,
    slug: prd.slug,
    is_published: prd.is_published,
    packages: prd.packages || [],
  });

  if (prd.notion_market_page_id) {
    await notionUpdatePage(settings.token, prd.notion_market_page_id, properties);
  } else {
    const pageId = await notionCreatePage(settings.token, settings.marketDbId, properties);
    if (pageId) {
      await sb.from("store_products").update({ notion_market_page_id: pageId }).eq("id", productId);
    }
  }

  return NextResponse.json({ ok: true });
}
