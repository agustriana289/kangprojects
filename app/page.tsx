import { ArrowRight, Star, CheckCircle2, Zap, MessageCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FadeIn from "@/components/landing/FadeIn";
import Pricing from "@/components/landing/Pricing";
import Steps from "@/components/landing/Steps";
import FAQSection from "@/components/landing/FAQSection";
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
    { data: testimonialsData },
    { data: usersData },
    { data: featuredService },
    { data: allServicesData },
    { data: nonAdminUsers },
  ] = await Promise.all([
    supabase.from("settings").select("*").eq("id", 1).single(),
    supabase.from("faqs").select("*").eq("target", "landing").eq("is_published", true).order("sort_order", { ascending: true }),
    supabase.from("store_testimonials").select("*, store_orders(order_number, form_data, store_products(title), store_services(title))").not("rating_quality", "is", null).order("created_at", { ascending: false }).limit(6),
    supabase.from("users").select("id, full_name, email, avatar_url"),
    supabase.from("store_services").select("*").eq("is_published", true).eq("is_featured", true).order("sort_order", { ascending: true }).limit(1).maybeSingle(),
    supabase.from("store_services").select("*").eq("is_published", true).order("sort_order", { ascending: true }),
    supabase.from("users").select("id, full_name, email, avatar_url").eq("is_admin", false).order("created_at", { ascending: false }).limit(8),
  ]);

  const settings = settingsData || {};
  const allServices = allServicesData || [];
  const recentNonAdminUsers = nonAdminUsers || [];

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

  const featuresList = settings.features_list && settings.features_list.length > 0
    ? settings.features_list
    : [
        { title: "Sangat Cepat", desc: "Konsep awal dalam 24 jam, tanpa menunggu lama.", icon: "Rocket" },
        { title: "Kualitas Premium", desc: "Dikerjakan oleh ahli dengan pengalaman bertahun-tahun.", icon: "Sparkles" },
        { title: "Revisi Tanpa Batas", desc: "Kami tidak puas sampai Anda puas.", icon: "CheckCircle" },
      ];

  const statsList = settings.stats_list && settings.stats_list.length > 0
    ? settings.stats_list
    : [
        { value: "24", suffix: "j", label: "Pengiriman Rata-rata" },
        { value: "∞", suffix: "", label: "Revisi Gratis" },
        { value: "500", suffix: "+", label: "Proyek Selesai" },
        { value: "99", suffix: "%", label: "Kepuasan Klien" },
      ];

  const heroTitleWords = settings?.hero_title ? settings.hero_title.split(" ") : "Wujudkan Identitas Merek yang Tak Terlupakan".split(" ");
  const midPoint = Math.ceil(heroTitleWords.length / 2);
  const heroTitleStart = heroTitleWords.slice(0, midPoint).join(" ");
  const heroTitleEnd = heroTitleWords.slice(midPoint).join(" ");

  const waNumber = settings?.phone_number ? settings.phone_number.replace(/\D/g, "") : "";
  const waHero = waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent("Halo, saya ingin konsultasi mengenai layanan Anda.")}` : "#";

  return (
    <>
      <Header />

      <main className="relative overflow-hidden">
        <div className="relative min-h-screen flex flex-col justify-center bg-slate-950 pt-20 pb-20 overflow-hidden">

          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full bg-primary/10 blur-[120px]" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-secondary/10 blur-[100px]" />
            <div className="absolute top-1/3 left-0 w-[300px] h-[300px] rounded-full bg-primary/5 blur-[80px]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
          </div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">

            <FadeIn delay={0}>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm px-4 py-1.5 text-sm font-medium text-white/70 mb-8">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span>{settings?.hero_badge || "Jasa Desain & Pengembangan Profesional"}</span>
              </div>
            </FadeIn>

            <FadeIn delay={80}>
              <h1 className="mx-auto max-w-4xl text-5xl font-extrabold tracking-tight text-white sm:text-7xl leading-[1.08] mb-6">
                {heroTitleStart}{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                  {heroTitleEnd}
                </span>
              </h1>
            </FadeIn>

            <FadeIn delay={160}>
              <p className="mx-auto max-w-2xl text-lg leading-8 text-white/60 mb-10">
                {settings?.hero_description || "Dari desain logo hingga website, kami menghadirkan solusi visual berkualitas tinggi yang memperkuat identitas merek dan mendorong pertumbuhan bisnis Anda."}
              </p>
            </FadeIn>

            <FadeIn delay={240}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                <a
                  href={waHero}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex h-14 w-full sm:w-auto items-center justify-center gap-2.5 rounded-full bg-primary px-8 text-base font-bold text-white transition-all hover:bg-secondary hover:shadow-2xl hover:shadow-primary/40 hover:-translate-y-0.5"
                >
                  <MessageCircle size={18} />
                  {settings?.hero_button1_text || "Mulai Konsultasi Gratis"}
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </a>
                <Link
                  href="#semua-layanan"
                  className="flex h-14 w-full sm:w-auto items-center justify-center rounded-full border border-white/15 bg-white/5 backdrop-blur-sm px-8 text-base font-semibold text-white/80 transition-all hover:bg-white/10 hover:border-white/25 hover:text-white"
                >
                  {settings?.hero_button2_text || "Lihat Layanan Kami"}
                </Link>
              </div>
            </FadeIn>

            <FadeIn delay={320}>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <div className="flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-2">
                  <div className="flex -space-x-2.5">
                    {recentNonAdminUsers.slice(0, 4).map((user: any) => (
                      user.avatar_url ? (
                        <img
                          key={user.id}
                          src={user.avatar_url}
                          alt={user.full_name || "User"}
                          className="w-7 h-7 rounded-full ring-2 ring-slate-950 object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div key={user.id} className="w-7 h-7 flex items-center justify-center rounded-full ring-2 ring-slate-950 bg-primary/20 text-primary font-bold text-xs shrink-0">
                          {(user.full_name || user.email || "U").charAt(0).toUpperCase()}
                        </div>
                      )
                    ))}
                  </div>
                  <span className="text-sm font-medium text-white/70">
                    {recentNonAdminUsers.length > 0 ? `${recentNonAdminUsers.length}+ klien aktif` : "Dipercaya banyak klien"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-4 py-2">
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => <Star key={i} size={13} fill="currentColor" strokeWidth={0} />)}
                  </div>
                  <span className="text-sm font-medium text-white/70">
                    {avgRating > 0 ? avgRating.toFixed(1) : "5.0"} rating
                  </span>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-4 py-2">
                  <Zap size={14} className="text-primary" />
                  <span className="text-sm font-medium text-white/70">Respon cepat</span>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>

        <div className="bg-white py-16 sm:py-20 border-b border-slate-100">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-10">
              {statsList.map((stat: any, idx: number) => (
                <FadeIn key={idx} delay={idx * 80} className="text-center">
                  <p className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
                    {stat.value}<span className="text-primary text-3xl">{stat.suffix}</span>
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-500">{stat.label}</p>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white py-16 sm:py-20 border-b border-slate-100">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {featuresList.map((feature: any, idx: number) => (
                <FadeIn key={idx} delay={idx * 100}>
                  <div className="group relative flex gap-5 items-start p-6 rounded-2xl bg-slate-50 hover:bg-primary/5 border border-transparent hover:border-primary/15 transition-all duration-300">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                      <DynamicIcon name={feature.icon || "Sparkles"} size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 mb-1 group-hover:text-primary transition-colors">{feature.title}</h3>
                      <p className="text-sm text-slate-500 leading-relaxed">{feature.desc}</p>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </main>

      <AllServices settings={settings} services={allServices} />
      <WhyChooseUs settings={settings} />
      <TestimonialSection settings={settings} testimonials={testimonials} />
      <Pricing settings={settings} featuredService={featuredService} whatsappNumber={waNumber} />
      <Steps settings={settings} />
      <FAQSection
        faqs={landingFaqs || []}
        title={settings?.faq_title || "Pertanyaan yang Sering Diajukan"}
        badge={settings?.faq_badge || "FAQ"}
      />
      <CTA settings={settings} />
      <Footer />
    </>
  );
}