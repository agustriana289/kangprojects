import { Check, Tag } from "lucide-react";
import FadeIn from "./FadeIn";
import { calculateDiscountedPrice } from "@/utils/discounts";

const tiers = [
  {
    name: "Starter",
    id: "tier-starter",
    href: "#",
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
    href: "#",
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
    href: "#",
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

export default function Pricing({ settings, featuredService, type = "service", activeDiscounts = [] }: { settings?: any, featuredService?: any, type?: "service" | "product", activeDiscounts?: any[] }) {
  let displayTiers: any[] = tiers;
  if (featuredService && featuredService.packages && featuredService.packages.length > 0) {
    displayTiers = featuredService.packages.map((pkg: any, index: number) => {
      const { originalPrice, discountedPrice, appliedDiscount } = calculateDiscountedPrice(pkg.price, activeDiscounts, featuredService.id, type);
      
      return {
        name: pkg.name,
        id: `tier-${pkg.name.toLowerCase().replace(/\s+/g, '-')}`,
        href: `/checkout?type=${type}&slug=${featuredService.slug}&plan=${encodeURIComponent(pkg.name)}`,
        priceMonthly: `Rp ${Number(discountedPrice).toLocaleString("id-ID")}`,
        originalPriceDisplay: `Rp ${Number(originalPrice).toLocaleString("id-ID")}`,
        appliedDiscount,
        description: pkg.description,
        features: pkg.features || [],
        // Highlight the middle one or a specific one
        featured: index === Math.floor(featuredService.packages.length / 2),
        cta: "Pesan Sekarang",
      } as any;
    });
  }
  
  return (
    <section className="bg-white py-24 sm:py-32" id="pricing">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn delay={100} className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-medium text-primary mb-4">
            <span>{settings?.pricing_badge || "Harga Transparan"}</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            {settings?.pricing_title || "Harga sederhana dan transparan"}
          </h2>
          <p className="mt-6 text-xl leading-8 text-slate-600">
            {settings?.pricing_description || "Tidak ada biaya tersembunyi. Tidak ada kejutan tagihan. Pilih paket yang paling sesuai dengan kebutuhan merek Anda."}
          </p>
        </FadeIn>

        <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-x-8 xl:gap-x-12">
          {displayTiers.map((tier, idx) => (
            <FadeIn
              key={tier.id}
              delay={150 + idx * 100}
              className={`rounded-3xl p-8 xl:p-10 ring-1 transition-all duration-300 hover:-translate-y-1 relative ${
                tier.featured
                  ? "bg-slate-900 ring-slate-900 shadow-2xl lg:scale-105 lg:z-10"
                  : "bg-slate-50 ring-slate-100/80 shadow-sm hover:shadow-xl"
              }`}
            >
              {tier.appliedDiscount && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-md flex items-center gap-1.5 whitespace-nowrap">
                  <Tag size={12} /> {tier.appliedDiscount.name} Diterapkan
                </div>
              )}
              <div className="flex items-center justify-between gap-x-4">
                <h3
                  id={tier.id}
                  className={`text-xl font-semibold leading-8 ${
                    tier.featured ? "text-white" : "text-slate-900"
                  }`}
                >
                  {tier.name}
                </h3>
                {tier.featured && (
                  <p className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold leading-5 text-primary border border-primary/20">
                    Paling populer
                  </p>
                )}
              </div>
              <p
                className={`mt-4 text-sm leading-6 ${tier.featured ? "text-slate-300" : "text-slate-600"}`}
              >
                {tier.description}
              </p>
              <div className="mt-6">
                {tier.appliedDiscount ? (
                  <div className="flex flex-col">
                    <span className={`text-sm font-medium line-through mb-1 ${tier.featured ? "text-primary" : "text-slate-400"}`}>
                      {tier.originalPriceDisplay}
                    </span>
                    <p className="flex items-baseline gap-x-1">
                      <span className={`text-4xl font-bold tracking-tight ${tier.featured ? "text-white" : "text-slate-900"}`}>
                        {tier.priceMonthly}
                      </span>
                      <span className={`text-sm font-semibold leading-6 ${tier.featured ? "text-slate-400" : "text-slate-500"}`}>
                        /proyek
                      </span>
                    </p>
                  </div>
                ) : (
                  <p className="flex items-baseline gap-x-1">
                    <span
                      className={`text-4xl font-bold tracking-tight ${tier.featured ? "text-white" : "text-slate-900"}`}
                    >
                      {tier.priceMonthly}
                    </span>
                    <span
                      className={`text-sm font-semibold leading-6 ${tier.featured ? "text-slate-400" : "text-slate-500"}`}
                    >
                      /proyek
                    </span>
                  </p>
                )}
              </div>
              <a
                href={tier.href}
                aria-describedby={tier.id}
                className={`mt-6 block rounded-full px-3 py-3 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-all duration-300 ${
                  tier.featured
                    ? "bg-primary text-white shadow-sm hover:bg-secondary focus-visible:outline-primary hover:shadow-primary/30 hover:shadow-lg"
                    : "bg-white text-slate-900 ring-1 ring-inset ring-slate-200 hover:ring-slate-300 hover:bg-slate-50"
                }`}
              >
                {tier.cta}
              </a>
              <ul
                role="list"
                className={`mt-8 space-y-3 text-sm leading-6 sm:mt-10 ${
                  tier.featured ? "text-slate-300" : "text-slate-600"
                }`}
              >
                {tier.features.map((feature: string) => (
                  <li key={feature} className="flex gap-x-3">
                    <Check
                      className={`h-6 w-5 flex-none ${tier.featured ? "text-primary" : "text-primary"}`}
                      aria-hidden="true"
                    />
                    {feature}
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