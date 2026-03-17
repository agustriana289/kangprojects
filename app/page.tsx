import { ArrowRight, Star } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FadeIn from "@/components/landing/FadeIn";
import PortfolioGallery from "@/components/landing/PortfolioGallery";
import HighlightedPortfolio from "@/components/landing/HighlightedPortfolio";
import Pricing from "@/components/landing/Pricing";
import Steps from "@/components/landing/Steps";
import FAQSection from "@/components/landing/FAQSection";
import Articles from "@/components/landing/Articles";
import CTA from "@/components/landing/CTA";
import TestimonialSection from "@/components/landing/TestimonialSection";
import WhyChooseUs from "@/components/landing/WhyChooseUs";
import AllServices from "@/components/landing/AllServices";
import DynamicIcon from "@/components/dashboard/DynamicIcon";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

export const revalidate = 60;

export default async function Home() {
  const supabase = await createClient();

  const [
    { data: settingsData },
    { data: landingFaqs },
    { data: portfoliosNewData },
    { data: portfoliosFavData },
    { data: testimonialsData },
    { data: usersData },
    { data: featuredService },
    { data: allServicesData },
    { count: portfolioCount },
    { data: nonAdminUsers },
  ] = await Promise.all([
    supabase.from("settings").select("*").eq("id", 1).single(),
    supabase.from("faqs").select("*").eq("target", "landing").eq("is_published", true).order("sort_order", { ascending: true }),
    supabase.from("store_portfolios").select("id, title, category, images, is_favorite").eq("is_published", true).order("created_at", { ascending: false }).limit(13),
    supabase.from("store_portfolios").select("id, title, category, images, is_favorite").eq("is_published", true).eq("is_favorite", true).order("created_at", { ascending: false }).limit(6),
    supabase.from("store_testimonials").select("*, store_orders(order_number, form_data, store_products(title), store_services(title))").not("rating_quality", "is", null).order("created_at", { ascending: false }).limit(6),
    supabase.from("users").select("id, full_name, email, avatar_url"),
    supabase.from("store_services").select("*").eq("is_published", true).eq("is_featured", true).order("sort_order", { ascending: true }).limit(1).maybeSingle(),
    supabase.from("store_services").select("*").eq("is_published", true).order("sort_order", { ascending: true }),
    supabase.from("store_portfolios").select("*", { count: "exact", head: true }).eq("is_published", true),
    supabase.from("users").select("id, full_name, email, avatar_url").eq("is_admin", false).order("created_at", { ascending: false }).limit(10),
  ]);

  const settings = settingsData || {};

  const featuresList = settings.features_list && settings.features_list.length > 0
    ? settings.features_list
    : [
        { title: "Sangat Cepat", desc: "Dapatkan konsep awal logo Anda dalam waktu kurang dari 24 jam.", icon: "Rocket" },
        { title: "Kualitas Premium", desc: "Dibuat oleh desainer ahli dengan pengalaman branding bertahun-tahun.", icon: "Sparkles" },
        { title: "Revisi Tanpa Batas", desc: "Kami tidak puas sampai Anda puas. Sesuaikan hingga sempurna.", icon: "CheckCircle" },
      ];

  const portfoliosNew = portfoliosNewData || [];
  const portfoliosFav = portfoliosFavData || [];
  const allServices = allServicesData || [];

  const profileMap: Record<string, any> = {};
  (usersData || []).forEach((u: any) => { profileMap[u.id] = u; });

  const testimonials = (testimonialsData || []).map((t: any) => {
    const user = t.user_id ? profileMap[t.user_id] : null;
    return {
      ...t,
      client_name: t.client_name || user?.full_name || user?.email?.split("@")[0] || "Klien",
    };
  });

  const allTestimonialsForRating = testimonialsData || [];
  let avgRating = 0;
  if (allTestimonialsForRating.length > 0) {
    const sum = allTestimonialsForRating.reduce((acc: number, t: any) => {
      const ratings = [t.rating_quality, t.rating_communication, t.rating_speed].filter(Boolean);
      const avg = ratings.length > 0 ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : 0;
      return acc + avg;
    }, 0);
    avgRating = sum / allTestimonialsForRating.length;
  }

  const totalPortfolios = portfolioCount || 0;
  const recentNonAdminUsers = nonAdminUsers || [];
  const portfolioCountDisplay = totalPortfolios > 0 ? String(totalPortfolios) : "200";

  const baseStatsList = settings.stats_list && settings.stats_list.length > 0
    ? settings.stats_list
    : [
        { value: "24", suffix: "j", label: "Rata-rata Pengiriman" },
        { value: "∞", suffix: "", label: "Revisi Gratis" },
        { value: portfolioCountDisplay, suffix: "+", label: "Ulasan Bintang 5" },
        { value: "99", suffix: "%", label: "Kepuasan Klien" },
      ];

  // Paksa stat ke-3 (index 2) agar selalu nilai total portofolio dinamis
  const statsList = baseStatsList.map((stat: any, idx: number) => {
    if (idx === 2) {
      return { ...stat, value: portfolioCountDisplay };
    }
    return stat;
  });

  const heroTitleWords = settings?.hero_title ? settings.hero_title.split(" ") : "Rancang identitas merek Anda yang sempurna".split(" ");
  const heroTitleStart = heroTitleWords.slice(0, -2).join(" ");
  const heroTitleEnd = heroTitleWords.slice(-2).join(" ");

  return (
    <>
      <Header />

      <main className="relative overflow-hidden pt-16 pb-32 lg:pt-32">
        <div
          className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
          aria-hidden="true"
        >
          <div
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary to-secondary opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
            style={{
              clipPath:
                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
            }}
          ></div>
        </div>

        <FadeIn delay={100} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/50 px-3 py-1 text-sm font-medium text-theme-2 mb-8 backdrop-blur-sm">
            <DynamicIcon name="Sparkles" size={16} />
            <span>{settings?.hero_badge || "Desain Logo Cepat & Premium"}</span>
          </div>
          <h1 className="mx-auto max-w-4xl text-5xl font-extrabold tracking-tight text-slate-900 sm:text-7xl leading-[1.1]">
            {heroTitleStart}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              {heroTitleEnd}
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            {settings?.hero_description || "Desain logo profesional yang berbicara kepada audiens Anda. Kami membangun identitas visual yang mudah diingat, dapat dikembangkan, dan cepat dikirimkan. Mulai babak baru Anda hari ini."}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href={settings?.hero_button1_url || "/shop"} className="group w-full sm:w-auto flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-8 text-base font-semibold text-white transition-all hover:bg-secondary hover:shadow-lg hover:shadow-indigo-200 focus:ring-4 focus:ring-indigo-100">
              {settings?.hero_button1_text || "Pesan Logo Anda"}
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link href={settings?.hero_button2_url || "/#portfolio"} className="flex w-full sm:w-auto h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-8 text-base font-semibold text-slate-900 transition-all hover:border-slate-300 hover:bg-slate-50 focus:ring-4 focus:ring-slate-100">
              {settings?.hero_button2_text || "Lihat Portofolio"}
            </Link>
          </div>
        </FadeIn>

        <div className="mx-auto mt-20 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {featuresList.map((feature: any, idx: number) => (
              <FadeIn
                key={idx}
                delay={idx * 150}
                className="relative overflow-hidden rounded-3xl bg-slate-50 p-8 sm:p-10 transition-shadow hover:shadow-md h-full"
              >
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm text-primary">
                  <DynamicIcon name={feature.icon || "Sparkles"} size={24} />
                </div>
                <h3 className="mb-3 text-xl font-semibold text-slate-900">
                  {feature.title}
                </h3>
                <p className="text-slate-600">{feature.desc}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </main>



      <section className="bg-white py-16 sm:py-24 border-t border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn delay={200} className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between rounded-3xl bg-primary p-8 sm:p-12">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={18} fill="currentColor" strokeWidth={0} />
                  ))}
                </div>
                <span className="text-sm font-semibold text-white">
                  {avgRating > 0 ? avgRating.toFixed(1) : "5.0"}/5 Rata-rata Penilaian
                </span>
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {settings?.trusted_by_title || `Dipercaya oleh ${totalPortfolios > 0 ? totalPortfolios.toLocaleString("id-ID") : "5.000"}+ merek ambisius`}
              </h2>
              <p className="mt-4 text-lg text-white">
                {settings?.trusted_by_description || "Dari perusahaan rintisan hingga perusahaan global, kami memberikan identitas visual kelas dunia yang menarik perhatian."}
              </p>

              <div className="mt-8 flex items-center gap-x-4">
                <div className="flex -space-x-3">
                  {recentNonAdminUsers.slice(0, 4).map((user: any) => (
                    user.avatar_url ? (
                      <img
                        key={user.id}
                        src={user.avatar_url}
                        alt={user.full_name || user.email || "User"}
                        className="h-10 w-10 rounded-full ring-2 ring-primary object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div key={user.id} className="h-10 w-10 flex items-center justify-center rounded-full ring-2 ring-primary bg-indigo-200 text-secondary font-bold text-sm shrink-0">
                        {(user.full_name || user.email || "U").charAt(0).toUpperCase()}
                      </div>
                    )
                  ))}
                  {recentNonAdminUsers.length > 4 && (
                    <div className="h-10 w-10 flex items-center justify-center rounded-full ring-2 ring-primary bg-white border border-slate-200 text-primary font-medium text-xs shrink-0">
                      +{recentNonAdminUsers.length - 4}
                    </div>
                  )}
                </div>
                <p className="text-sm text-white font-medium">{settings?.stats_title || "Bergabunglah bersama kami"}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 sm:grid-cols-2 lg:gap-12 pl-0 lg:pl-12 lg:border-l lg:border-slate-200">
              {statsList.map((stat: any, idx: number) => (
                <div key={idx} className="flex flex-col">
                  <span className="text-4xl font-bold tracking-tight text-white">
                    {stat.value}
                    {stat.suffix && <span className="text-2xl text-white">{stat.suffix}</span>}
                  </span>
                  <span className="mt-2 text-sm font-medium text-white">{stat.label}</span>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      <PortfolioGallery settings={settings} portfolios={portfoliosFav} />
      <WhyChooseUs settings={settings} />
      <TestimonialSection settings={settings} testimonials={testimonials} />
      <Pricing settings={settings} featuredService={featuredService} />
      <Steps settings={settings} />
      <HighlightedPortfolio settings={settings} portfolios={portfoliosNew} />
      <FAQSection
        faqs={landingFaqs || []}
        title={settings?.faq_title || "Pertanyaan yang Sering Diajukan"}
        badge={settings?.faq_badge || "FAQ"}
      />
      <AllServices settings={settings} services={allServices} />
      <CTA settings={settings} />
      <Articles settings={settings} />
      <Footer />
    </>
  );
}