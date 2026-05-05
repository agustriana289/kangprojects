import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from "pdf-lib";

export const runtime = "nodejs";

const PW = 595.28;
const PH = 841.89;
const ML = 50;
const MR = 50;
const MB = 55;
const TW = PW - ML - MR;

const BLUE = rgb(0.055, 0.259, 0.675);
const BLUE_LIGHT = rgb(0.906, 0.922, 0.969);
const BLUE_BORDER = rgb(0.2, 0.42, 0.78);
const TEXT = rgb(0.12, 0.12, 0.12);
const WHITE = rgb(1, 1, 1);
const GRAY = rgb(0.45, 0.45, 0.45);

type Section = { type: "heading" | "bullet" | "body" | "sub"; text: string };

const LEGAL: Section[] = [
  { type: "heading", text: "PREAMBLE" },
  { type: "bullet", text: "Lisensi ini merupakan perjanjian hukum antara Kanglogo.com selaku pihak Desainer, dengan Klien sebagaimana tercantum di atas, berkenaan dengan penggunaan karya desain logo yang telah diselesaikan. Lisensi ini hanya diterbitkan untuk paket layanan tertentu dan tidak berlaku secara umum untuk semua paket yang tersedia di kanglogo.com. Dengan diterimanya dokumen ini, kedua pihak dianggap telah membaca, memahami, dan menyetujui seluruh ketentuan yang tercantum." },
  { type: "bullet", text: "Dokumen ini disusun dengan mengacu pada ketentuan hukum yang berlaku di Republik Indonesia, antara lain Undang-Undang No. 28 Tahun 2014 tentang Hak Cipta, Undang-Undang No. 20 Tahun 2016 tentang Merek dan Indikasi Geografis, serta prinsip-prinsip hukum internasional yang relevan dalam bidang kekayaan intelektual." },
  { type: "heading", text: "PASAL 1 — PENGALIHAN HAK DESAIN" },
  { type: "bullet", text: "Desainer menyerahkan sepenuhnya hak kepemilikan atas karya desain logo kepada Klien setelah seluruh proses pembayaran dinyatakan lunas dan tahap pengerjaan dinyatakan selesai oleh kedua belah pihak." },
  { type: "bullet", text: "Pengalihan hak mencakup seluruh aset digital yang diserahkan, termasuk namun tidak terbatas pada file vektor, file raster, dan panduan penggunaan logo (brand guideline) yang disertakan." },
  { type: "bullet", text: "Pengalihan ini bersifat eksklusif dan permanen, kecuali terjadi kondisi yang diatur pada pasal-pasal berikutnya." },
  { type: "heading", text: "PASAL 2 — HAK PENGGUNAAN KLIEN" },
  { type: "bullet", text: "Klien memiliki hak penuh untuk menggunakan logo yang telah dibuat untuk seluruh keperluan, baik bersifat personal maupun komersil, tanpa batasan wilayah maupun media." },
  { type: "bullet", text: "Hak penggunaan komersil meliputi namun tidak terbatas pada: pemasaran, periklanan, merchandising, pendaftaran merek dagang, penggunaan digital maupun cetak, serta seluruh kegiatan bisnis Klien." },
  { type: "bullet", text: "Klien berhak mendaftarkan logo tersebut sebagai merek dagang atas namanya sesuai peraturan yang berlaku." },
  { type: "heading", text: "PASAL 3 — HAK PORTOFOLIO DESAINER" },
  { type: "bullet", text: "Meskipun hak kepemilikan logo telah dialihkan kepada Klien, Desainer tetap berhak untuk menampilkan karya logo tersebut sebagai bagian dari portofolio profesional di media manapun, termasuk website, media sosial, maupun pameran karya." },
  { type: "bullet", text: "Sebelum menampilkan karya tersebut secara publik, Desainer akan terlebih dahulu meminta persetujuan dari Klien. Apabila dalam waktu 14 (empat belas) hari kerja tidak ada tanggapan, maka dianggap Klien memberikan persetujuan secara diam-diam (implied consent)." },
  { type: "bullet", text: "Penampilan portofolio oleh Desainer semata-mata untuk tujuan promosi profesional, bukan untuk menjual ulang atau menduplikasi logo milik Klien." },
  { type: "heading", text: "PASAL 4 — INTEGRITAS KARYA & ATRIBUSI" },
  { type: "bullet", text: "Klien tidak diperkenankan mengklaim bahwa logo yang dibuat oleh Desainer adalah hasil karya orang lain selain Desainer asal (Kanglogo.com). Hal ini berlaku sekalipun hak kepemilikan logo telah sepenuhnya dialihkan." },
  { type: "bullet", text: "Klien diperbolehkan untuk tidak menyebutkan secara aktif nama Desainer dalam penggunaan sehari-hari, namun tidak boleh secara sengaja menyesatkan pihak lain mengenai asal-usul karya." },
  { type: "bullet", text: "Pelanggaran terhadap pasal ini dapat dikategorikan sebagai pemalsuan asal-usul karya yang merupakan pelanggaran terhadap UU Hak Cipta No. 28 Tahun 2014." },
  { type: "heading", text: "PASAL 5 — MODIFIKASI LOGO" },
  { type: "bullet", text: "Klien berhak melakukan perubahan minor pada logo (perubahan kurang dari 50% dari keseluruhan elemen visual) untuk kebutuhan adaptasi internal." },
  { type: "bullet", text: "Apabila modifikasi yang dilakukan mencapai atau melebihi 50% dari elemen visual logo, maka logo hasil modifikasi tersebut sepenuhnya menjadi tanggung jawab Klien atau pihak yang melakukan modifikasi. Desainer tidak bertanggung jawab atas segala risiko hukum, teknis, maupun reputasi yang timbul dari logo hasil modifikasi." },
  { type: "bullet", text: "Jika Klien menginginkan perbaikan atau pembuatan ulang setelah terjadi modifikasi sebagaimana dimaksud ayat (2), maka hal tersebut akan diperlakukan sebagai proyek desain logo baru dan akan dikenai biaya layanan baru sesuai paket yang berlaku." },
  { type: "heading", text: "PASAL 6 — PENGALIHAN KEPADA PIHAK KETIGA" },
  { type: "bullet", text: "Apabila logo atau entitas bisnis yang menggunakan logo tersebut dialihkan kepada pihak lain (akuisisi, merger, penjualan bisnis, dll.), maka status lisensi logo tetap berlaku sebagai lisensi komersil." },
  { type: "bullet", text: "Namun demikian, tidak terdapat hubungan hukum langsung antara Desainer dengan pihak penerima pengalihan (pihak baru) tersebut. Segala permintaan layanan, revisi, atau konsultasi dari pihak baru akan dianggap sebagai klien baru dan tunduk pada syarat serta biaya layanan yang berlaku saat itu." },
  { type: "bullet", text: "Klien asal bertanggung jawab untuk menginformasikan ketentuan lisensi ini kepada pihak yang menerima pengalihan." },
  { type: "heading", text: "PASAL 7 — PERLINDUNGAN TERHADAP PENCURIAN & PENYALAHGUNAAN" },
  { type: "bullet", text: "Setelah logo dinyatakan selesai dan hak kepemilikan telah dialihkan, Klien adalah pemegang hak sah atas logo tersebut. Oleh karenanya, apabila logo digunakan, diklaim, atau disebarluaskan oleh pihak lain tanpa seizin Klien, maka Klien berhak melakukan pelaporan hukum atas tindakan pencurian aset, pelanggaran hak cipta, dan/atau klaim identitas palsu kepada pihak berwenang." },
  { type: "bullet", text: "Desainer tidak diwajibkan untuk turut serta dalam proses hukum yang diajukan oleh Klien setelah tahap pengerjaan dinyatakan selesai, kecuali jika kasus tersebut timbul akibat kelalaian atau tindakan Desainer sendiri." },
  { type: "bullet", text: "Apabila penyalahgunaan terjadi saat proses pengerjaan masih berlangsung dan belum ada serah terima resmi, maka tanggung jawab penyelesaian berada di pihak Desainer." },
  { type: "bullet", text: "Termasuk dalam cakupan perlindungan ini adalah kasus di mana pihak ketiga menggunakan logo secara komersil, menjualnya, atau menggunakannya dalam kegiatan yang dapat merugikan Klien secara finansial maupun reputasional." },
  { type: "heading", text: "PASAL 8 — KETENTUAN UMUM & LANDASAN HUKUM" },
  { type: "bullet", text: "Lisensi ini tunduk pada dan diatur oleh hukum Republik Indonesia." },
  { type: "bullet", text: "Landasan hukum yang menjadi rujukan dalam lisensi ini mencakup: Undang-Undang No. 28 Tahun 2014 tentang Hak Cipta, Undang-Undang No. 20 Tahun 2016 tentang Merek dan Indikasi Geografis, Undang-Undang No. 19 Tahun 2016 tentang Informasi dan Transaksi Elektronik (ITE), serta prinsip-prinsip perlindungan hak kekayaan intelektual internasional berdasarkan WIPO Copyright Treaty dan Berne Convention." },
  { type: "bullet", text: "Apabila terdapat sengketa yang timbul dari lisensi ini, para pihak sepakat untuk menyelesaikannya secara musyawarah mufakat terlebih dahulu. Jika tidak tercapai kesepakatan, maka penyelesaian dilakukan melalui jalur hukum yang berlaku di wilayah hukum Republik Indonesia." },
  { type: "bullet", text: "Ketentuan dalam lisensi ini bersifat mengikat dan tidak dapat diubah secara sepihak tanpa persetujuan tertulis dari kedua belah pihak." },
];

function wrapText(text: string, font: PDFFont, size: number, maxW: number): string[] {
  const words = text.split(" ").filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (font.widthOfTextAtSize(test, size) > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [""];
}

interface Ctx {
  doc: PDFDocument;
  page: PDFPage;
  y: number;
  fn: PDFFont;
  fb: PDFFont;
}

function addPage(ctx: Ctx) {
  ctx.page = ctx.doc.addPage([PW, PH]);
  ctx.y = PH - 45;
}

function ensureSpace(ctx: Ctx, needed: number) {
  if (ctx.y - needed < MB) addPage(ctx);
}

function drawWrapped(ctx: Ctx, text: string, opts: {
  size?: number; bold?: boolean; color?: ReturnType<typeof rgb>;
  x?: number; maxW?: number; lh?: number;
}) {
  const { size = 9, bold = false, color = TEXT, x = ML, maxW = TW } = opts;
  const font = bold ? ctx.fb : ctx.fn;
  const lh = opts.lh ?? size * 1.55;
  const lines = wrapText(text, font, size, maxW);
  for (const line of lines) {
    ensureSpace(ctx, lh);
    ctx.page.drawText(line, { x, y: ctx.y, size, font, color });
    ctx.y -= lh;
  }
}

function formatDate(d: string) {
  const dt = new Date(d);
  const m = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  return `${dt.getDate()} ${m[dt.getMonth()]} ${dt.getFullYear()}`;
}

function licenseNumber(id: string, createdAt: string) {
  const y = new Date(createdAt).getFullYear();
  return `LIC/${y}/${id.replace(/-/g,"").substring(0,8).toUpperCase()}`;
}

export async function GET(req: NextRequest) {
  const supabaseUser = await createServerClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabaseUser.from("users").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const orderId = new URL(req.url).searchParams.get("orderId");
  if (!orderId) return NextResponse.json({ error: "orderId diperlukan" }, { status: 400 });

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: order, error } = await supabaseAdmin
    .from("store_orders")
    .select("*, store_services(title), store_products(title)")
    .eq("id", orderId)
    .single();

  if (error || !order) return NextResponse.json({ error: "Proyek tidak ditemukan" }, { status: 404 });
  if (order.status !== "completed") return NextResponse.json({ error: "Hanya untuk proyek selesai" }, { status: 403 });

  let fd: Record<string, string> = {};
  try { fd = typeof order.form_data === "string" ? JSON.parse(order.form_data) : (order.form_data || {}); } catch {}

  let clientName = order.guest_name || fd.customer_name || fd["Client Name"] || "—";
  if (order.user_id) {
    const { data: u } = await supabaseAdmin.from("users").select("full_name").eq("id", order.user_id).single();
    if (u?.full_name) clientName = u.full_name;
  }

  const projectTitle = fd.project_title || fd["Project Title"] || fd["Nama Logo"] || "—";
  const serviceName = order.store_services?.title || order.store_products?.title || order.custom_item_name || "—";
  let pkgName = "—";
  try {
    const sp = typeof order.selected_package === "string" ? JSON.parse(order.selected_package) : order.selected_package;
    pkgName = sp?.name || order.custom_package_name || "—";
  } catch {}

  const paketLayanan = pkgName !== "—" ? `${serviceName} - ${pkgName}` : serviceName;
  const tanggalTerbit = formatDate(order.updated_at || order.created_at);
  const nomorLisensi = licenseNumber(order.id, order.created_at);

  const doc = await PDFDocument.create();
  const fn = await doc.embedFont(StandardFonts.Helvetica);
  const fb = await doc.embedFont(StandardFonts.HelveticaBold);

  const ctx: Ctx = { doc, page: doc.addPage([PW, PH]), y: PH - 45, fn, fb };

  const titleH = 52;
  ctx.page.drawRectangle({ x: 0, y: PH - titleH, width: PW, height: titleH, color: BLUE });
  const titleText = "SERTIFIKAT LISENSI PENGGUNAAN LOGO";
  const titleW = fb.widthOfTextAtSize(titleText, 14);
  ctx.page.drawText(titleText, { x: (PW - titleW) / 2, y: PH - 33, size: 14, font: fb, color: WHITE });
  ctx.y = PH - titleH - 20;

  const tableFields: [string, string][] = [
    ["Nama Klien", clientName],
    ["Nama / Brand Logo", projectTitle],
    ["Tanggal Terbit", tanggalTerbit],
    ["Nomor Lisensi", nomorLisensi],
    ["Paket Layanan", paketLayanan],
  ];

  const colLabel = ML;
  const colValue = ML + TW / 2;
  const colW = TW / 2;
  const rowH = 22;
  const tableH = tableFields.length * rowH + 1;

  ctx.page.drawRectangle({ x: ML - 1, y: ctx.y - tableH, width: TW + 2, height: tableH + 1, color: BLUE_BORDER });

  tableFields.forEach(([label, value], i) => {
    const rowY = ctx.y - i * rowH;
    const bg = i % 2 === 0 ? BLUE_LIGHT : WHITE;
    ctx.page.drawRectangle({ x: ML, y: rowY - rowH, width: TW, height: rowH, color: bg });
    ctx.page.drawLine({ start: { x: colValue, y: rowY }, end: { x: colValue, y: rowY - rowH }, thickness: 0.8, color: BLUE_BORDER });
    const textY = rowY - rowH + 7;
    ctx.page.drawText(label, { x: colLabel + 6, y: textY, size: 9, font: fb, color: BLUE });
    const wrapped = wrapText(value, fn, 9, colW - 12);
    ctx.page.drawText(wrapped[0] || "", { x: colValue + 6, y: textY, size: 9, font: fn, color: TEXT });
  });

  ctx.y -= tableH + 18;

  for (const sec of LEGAL) {
    if (sec.type === "heading") {
      ensureSpace(ctx, 28);
      ctx.y -= 6;
      drawWrapped(ctx, sec.text, { size: 9.5, bold: true, color: BLUE, lh: 14 });
      ctx.y -= 3;
    } else if (sec.type === "bullet") {
      ensureSpace(ctx, 14);
      const bullet = "•";
      ctx.page.drawText(bullet, { x: ML + 4, y: ctx.y, size: 9, font: fn, color: TEXT });
      drawWrapped(ctx, sec.text, { size: 9, x: ML + 14, maxW: TW - 14, lh: 13.5 });
      ctx.y -= 2;
    }
  }

  ctx.y -= 14;
  ensureSpace(ctx, 110);

  const agreementText = "Dengan ditandatanganinya dokumen ini, para pihak menyatakan telah membaca, memahami, dan menyetujui seluruh ketentuan yang tercantum dalam Sertifikat Lisensi Penggunaan Logo ini.";
  ctx.page.drawText("PERSETUJUAN DAN PENANDATANGANAN", { x: ML, y: ctx.y, size: 9.5, font: fb, color: BLUE });
  ctx.y -= 14;
  drawWrapped(ctx, agreementText, { size: 9, color: TEXT });
  ctx.y -= 20;

  ensureSpace(ctx, 90);
  const sigY = ctx.y;
  const col1X = ML;
  const col2X = ML + TW / 2;

  ctx.page.drawText("Pihak Desainer", { x: col1X, y: sigY, size: 9, font: fb, color: TEXT });
  ctx.page.drawText("Pihak Klien", { x: col2X, y: sigY, size: 9, font: fb, color: TEXT });

  const lineY = sigY - 40;
  ctx.page.drawLine({ start: { x: col1X, y: lineY }, end: { x: col1X + 140, y: lineY }, thickness: 0.8, color: GRAY });
  ctx.page.drawLine({ start: { x: col2X, y: lineY }, end: { x: col2X + 140, y: lineY }, thickness: 0.8, color: GRAY });

  ctx.page.drawText("Agus Triana", { x: col1X, y: lineY - 12, size: 9, font: fb, color: TEXT });
  ctx.page.drawText(clientName, { x: col2X, y: lineY - 12, size: 9, font: fb, color: TEXT });

  ctx.page.drawText("Pihak Desainer Kanglogo.com", { x: col1X, y: lineY - 24, size: 8, font: fn, color: GRAY });
  ctx.page.drawText("Perwakilan Klien/Pelanggan", { x: col2X, y: lineY - 24, size: 8, font: fn, color: GRAY });

  const footerText = "Dokumen ini diterbitkan secara resmi oleh kanglogo.com  •  Dokumen sah tanpa memerlukan materai apabila telah ditandatangani kedua pihak";
  ctx.page.drawRectangle({ x: 0, y: 0, width: PW, height: MB - 10, color: BLUE });
  const ftW = fn.widthOfTextAtSize(footerText, 7.5);
  ctx.page.drawText(footerText, { x: (PW - ftW) / 2, y: 20, size: 7.5, font: fn, color: WHITE });

  const pdfBytes = await doc.save();
  const safe = projectTitle.replace(/[^a-zA-Z0-9\-_]/g, "_").substring(0, 40);
  const filename = `Lisensi_${safe}_${nomorLisensi.replace(/\//g, "-")}.pdf`;

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
