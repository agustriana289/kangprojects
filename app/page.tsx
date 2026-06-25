import { ArrowRight, Star, Zap, CheckCircle2 } from "lucide-react";
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
import AnimatedHeroTitle from "@/components/landing/AnimatedHeroTitle";
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

  const waNumber = settings?.phone_number ? settings.phone_number.replace(/\D/g, "") : "";
  const waHero = waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent("Halo, saya ingin konsultasi mengenai layanan Anda.")}` : "#";

  return (
    <>
      <Header />

      <main className="relative overflow-hidden bg-white selection:bg-primary/20 selection:text-primary">
        
        {/* HERO SECTION - CTA STYLE */}
        <div className="bg-white pt-8 pb-8 sm:pt-12 lg:pt-16 lg:pb-16 px-4 sm:px-6 lg:px-8">
          <div className="relative isolate overflow-hidden bg-gradient-to-br from-purple-100/80 via-white to-orange-50/80 rounded-[3rem] px-6 py-24 sm:py-32 lg:px-20 text-center shadow-sm border border-slate-100 mx-auto max-w-7xl">
            {/* Abstract background blur elements inside the box */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-200/40 rounded-full blur-3xl opacity-60 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[-1]"></div>
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-orange-200/50 rounded-full blur-3xl opacity-60 translate-x-1/4 pointer-events-none z-[-1]"></div>

            <div className="relative z-10">
            <FadeIn delay={0}>
              <div className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-purple-100 bg-white/60 backdrop-blur-sm px-4 py-1.5 text-sm font-medium text-slate-700 shadow-sm">
                <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                <span>{settings?.hero_badge || "Jasa Desain & Pengembangan Profesional"}</span>
              </div>
            </FadeIn>

            <FadeIn delay={80}>
              <AnimatedHeroTitle title={settings?.hero_title} />
            </FadeIn>

            <FadeIn delay={160}>
              <p className="mx-auto mt-8 max-w-2xl text-lg sm:text-xl leading-relaxed text-slate-500 font-medium">
                {settings?.hero_description || "Dari desain logo hingga website, kami menghadirkan solusi visual berkualitas tinggi yang memperkuat identitas merek dan mendorong pertumbuhan bisnis Anda."}
              </p>
            </FadeIn>

            <FadeIn delay={240}>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href={waHero}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex h-14 w-full sm:w-auto items-center justify-center gap-2.5 rounded-full bg-primary px-8 text-base font-bold text-white transition-all hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5"
                >
                  {settings?.hero_button1_text || "Mulai Konsultasi Gratis"}
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                </a>
                <Link
                  href="#semua-layanan"
                  className="group flex h-14 w-full sm:w-auto items-center justify-center rounded-full bg-slate-900 px-8 text-base font-bold text-white transition-all hover:bg-slate-800 hover:shadow-lg hover:-translate-y-0.5"
                >
                  {settings?.hero_button2_text || "Lihat Layanan Kami"}
                </Link>
              </div>
            </FadeIn>

            <FadeIn delay={320}>
              <div className="mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-3">
                    {recentNonAdminUsers.slice(0, 4).map((user: any) => (
                      user.avatar_url ? (
                        <img
                          key={user.id}
                          src={user.avatar_url}
                          alt={user.full_name || "User"}
                          className="w-10 h-10 rounded-full ring-2 ring-white object-cover shadow-sm"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div key={user.id} className="w-10 h-10 flex items-center justify-center rounded-full ring-2 ring-white bg-slate-100 text-slate-500 font-bold text-sm shrink-0 shadow-sm">
                          {(user.full_name || user.email || "U").charAt(0).toUpperCase()}
                        </div>
                      )
                    ))}
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" strokeWidth={0} />)}
                    </div>
                    <span className="text-sm font-medium text-slate-600 block mt-0.5">
                      {avgRating > 0 ? avgRating.toFixed(1) : "5.0"} dari {recentNonAdminUsers.length > 0 ? `${recentNonAdminUsers.length}+` : "ratusan"} klien
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* LOGOS / STATS SECTION */}
        <div className="bg-white py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {statsList.map((stat: any, idx: number) => (
                <FadeIn key={idx} delay={idx * 100} className="text-center">
                  <p className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900">
                    {stat.value}<span className="text-primary">{stat.suffix}</span>
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-500 uppercase tracking-widest">{stat.label}</p>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>

        {/* VALUE PROPOSITION / FEATURES */}
        <div className="py-24 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuresList.map((feature: any, idx: number) => (
                <FadeIn key={idx} delay={idx * 100}>
                  <div className="group h-full p-8 rounded-[2rem] bg-white border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-all duration-300">
                    <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-700">
                      <DynamicIcon name={feature.icon || "Sparkles"} size={20} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2 tracking-tight">{feature.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{feature.desc}</p>
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