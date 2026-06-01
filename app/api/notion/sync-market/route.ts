import { NextResponse } from "next/server";
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

export async function POST() {
  const sb = supabaseAdmin();
  const settings = await getNotionSettings();

  if (!settings.enabled || !settings.token || !settings.marketDbId) {
    return NextResponse.json({ error: "Notion market belum dikonfigurasi atau dinonaktifkan" }, { status: 400 });
  }

  const { data: products, error } = await sb
    .from("store_products")
    .select("id, title, slug, description, category, packages, is_published, notion_market_page_id")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results = { synced: 0, created: 0, updated: 0, failed: 0 };

  for (const prd of products || []) {
    try {
      const properties = buildProductProperties({
        title: prd.title,
        category: prd.category,
        description: prd.description,
        slug: prd.slug,
        is_published: prd.is_published,
        packages: prd.packages || [],
      });

      if (prd.notion_market_page_id) {
        const ok = await notionUpdatePage(settings.token, prd.notion_market_page_id, properties);
        if (ok) { results.updated++; results.synced++; }
        else results.failed++;
      } else {
        const pageId = await notionCreatePage(settings.token, settings.marketDbId, properties);
        if (pageId) {
          await sb.from("store_products").update({ notion_market_page_id: pageId }).eq("id", prd.id);
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
