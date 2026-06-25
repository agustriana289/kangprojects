import { Check } from "lucide-react";
import FadeIn from "./FadeIn";

const tiers = [
  {
    name: "Starter",
    id: "tier-starter",
    priceMonthly: "$99",
    description: "Cocok untuk proyek kecil dan perusahaan startup baru.",
    features: [
      "1 Konsep Awal Logo",
      "3 Kali Revisi",
      "PNG & JPG Resolusi Tinggi",
      "Pengiriman Standar (3-5 hari)",
      "Hak Komersial Penuh",
    ],
    featured: false,
    cta: "Mulai Sekarang",
  },
  {
    name: "Professional",
    id: "tier-professional",
    priceMonthly: "$199",
    description: "Ideal untuk bisnis berkembang yang membutuhkan identitas yang kuat.",
    features: [
      "3 Konsep Awal Logo",
      "Revisi Tanpa Batas",
      "File Master (AI, EPS, SVG)",
      "PNG & JPG Resolusi Tinggi",
      "Pengiriman Cepat (48 jam)",
      "Palet Warna Merek",
      "Hak Komersial Penuh",
    ],
    featured: true,
    cta: "Mulai Proyek Anda",
  },
  {
    name: "Enterprise",
    id: "tier-enterprise",
    priceMonthly: "$499",
    description: "Branding komprehensif untuk perusahaan mapan.",
    features: [
      "5 Konsep Awal Logo",
      "Revisi Tanpa Batas",
      "File Master & Vektor",
      "Pengiriman Prioritas (24 jam)",
      "Panduan Merek Lengkap",
      "Perlengkapan Media Sosial",
      "Desain Alat Tulis",
      "Manajer Akun Khusus",
    ],
    featured: false,
    cta: "Hubungi Sales",
  },
];

export default function Pricing({ settings, featuredService, whatsappNumber }: { settings?: any, featuredService?: any, whatsappNumber?: string }) {
  let displayTiers: any[] = tiers;

  if (featuredService && featuredService.packages && featuredService.packages.length > 0) {
    displayTiers = featuredService.packages.map((pkg: any, index: number) => {
      const waNumber = whatsappNumber || "";
      const waText = encodeURIComponent(
        `Halo, saya tertarik dengan layanan ${featuredService.title} - Paket ${pkg.name} (Rp ${Number(pkg.price).toLocaleString("id-ID")}). Boleh minta info lebih lanjut?`
      );
      const waHref = waNumber ? `https://wa.me/${waNumber}?text=${waText}` : `https://wa.me/?text=${waText}`;

      return {
        name: pkg.name,
        id: `tier-${pkg.name.toLowerCase().replace(/\s+/g, '-')}`,
        href: waHref,
        priceMonthly: `Rp ${Number(pkg.price).toLocaleString("id-ID")}`,
        description: pkg.description,
        features: pkg.features || [],
        featured: index === Math.floor(featuredService.packages.length / 2),
        cta: "Pesan via WhatsApp",
      } as any;
    });
  }

  return (
    <section className="bg-slate-50 py-24 sm:py-32" id="pricing">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn delay={100} className="mx-auto max-w-3xl text-center mb-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-600 mb-6 shadow-sm">
            <span>{settings?.pricing_badge || "Harga Transparan"}</span>
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            {settings?.pricing_title || "Harga sederhana dan transparan"}
          </h2>
          <p className="mt-6 text-lg leading-8 text-slate-500">
            {settings?.pricing_description || "Pilih paket yang paling sesuai dengan kebutuhan merek Anda. Tanpa biaya tersembunyi."}
          </p>
        </FadeIn>

        <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {displayTiers.map((tier, idx) => (
            <FadeIn
              key={tier.id}
              delay={150 + idx * 100}
              className={`rounded-3xl p-8 xl:p-10 transition-all duration-300 relative h-full flex flex-col ${
                tier.featured
                  ? "bg-slate-900 ring-1 ring-slate-900 shadow-2xl lg:scale-105 z-10"
                  : "bg-white ring-1 ring-slate-200 shadow-sm hover:shadow-xl hover:ring-slate-300"
              }`}
            >
              <div className="flex items-center justify-between gap-x-4 mb-4">
                <h3
                  id={tier.id}
                  className={`text-xl font-bold tracking-tight ${
                    tier.featured ? "text-white" : "text-slate-900"
                  }`}
                >
                  {tier.name}
                </h3>
                {tier.featured && (
                  <p className="rounded-full bg-primary/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary border border-primary/30">
                    Populer
                  </p>
                )}
              </div>
              <p
                className={`text-sm leading-relaxed mb-8 ${tier.featured ? "text-slate-300" : "text-slate-500"}`}
              >
                {tier.description}
              </p>
              
              <div className="mb-8 flex items-baseline gap-x-1">
                <span
                  className={`text-4xl font-bold tracking-tight ${tier.featured ? "text-white" : "text-slate-900"}`}
                >
                  {tier.priceMonthly}
                </span>
              </div>
              
              <a
                href={tier.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-describedby={tier.id}
                className={`mt-auto block w-full rounded-full px-4 py-3.5 text-center text-sm font-bold transition-all duration-300 ${
                  tier.featured
                    ? "bg-primary text-white hover:bg-secondary shadow-lg shadow-primary/25"
                    : "bg-slate-50 text-slate-900 border border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                }`}
              >
                {tier.cta}
              </a>
              
              <ul
                role="list"
                className={`mt-10 space-y-4 text-sm leading-6 ${
                  tier.featured ? "text-slate-300" : "text-slate-600"
                }`}
              >
                {tier.features.map((feature: string) => (
                  <li key={feature} className="flex gap-x-3 items-start">
                    <Check
                      className={`h-5 w-5 shrink-0 ${tier.featured ? "text-primary" : "text-primary"}`}
                      aria-hidden="true"
                    />
                    <span className="font-medium">{feature}</span>
                  </li>
                ))}
              </ul>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}