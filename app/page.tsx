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
import DynamicIcon from "@/components/dashboard/DynamicIcon";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

export default async function Home() {
  const supabase = await createClient();

  // 1. Fetch settings
  const { data: settingsData } = await supabase.from("settings").select("*").eq("id", 1).single();
  const settings = settingsData || {};

  const featuresList = settings.features_list && settings.features_list.length > 0 
    ? settings.features_list 
    : [
        { title: "Lightning Fast", desc: "Get your initial logo concepts in less than 24 hours.", icon: "Rocket" },
        { title: "Premium Quality", desc: "Crafted by expert designers with years of branding experience.", icon: "Sparkles" },
        { title: "Unlimited Revisions", desc: "We are not happy until you are. Tweak it until it's perfect.", icon: "CheckCircle" },
      ];

  const statsList = settings.stats_list && settings.stats_list.length > 0
    ? settings.stats_list
    : [
        { value: "24", suffix: "h", label: "Average Delivery" },
        { value: "∞", suffix: "", label: "Free Revisions" },
        { value: "200", suffix: "+", label: "Five-star reviews" },
        { value: "99", suffix: "%", label: "Client Satisfaction" },
      ];

  // 2. Fetch FAQs
  const { data: landingFaqs } = await supabase
    .from("faqs")
    .select("*")
    .eq("target", "landing")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });

  // 3. Fetch Portfolios
  // A. Fetch only newest
  const { data: portfoliosNewData } = await supabase
    .from("store_portfolios")
    .select("id, title, category, images, is_favorite")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(13);
    
  const portfoliosNew = portfoliosNewData || [];

  // B. Fetch explicit favorites
  const { data: portfoliosFavData } = await supabase
    .from("store_portfolios")
    .select("id, title, category, images, is_favorite")
    .eq("is_published", true)
    .eq("is_favorite", true)
    .order("created_at", { ascending: false })
    .limit(6);
    
  const portfoliosFav = portfoliosFavData || [];

  // 4. Fetch Testimonials
  const { data: testimonialsData } = await supabase
    .from("store_testimonials")
    .select("*, users(id, full_name, email, avatar_url)")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(6);

  const testimonials = (testimonialsData || []).map((t: any) => ({
    ...t,
    client_name: t.client_name || t.users?.full_name || t.users?.email?.split("@")[0] || "Client",
  }));

  // 5. Fetch Featured Service for Pricing
  const { data: featuredService } = await supabase
    .from("store_services")
    .select("*")
    .eq("is_published", true)
    .eq("is_featured", true)
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  // Hero Splitting
  const heroTitleWords = settings?.hero_title ? settings.hero_title.split(" ") : "Design your brand's perfect identity".split(" ");
  const heroTitleStart = heroTitleWords.slice(0, -2).join(" ");
  const heroTitleEnd = heroTitleWords.slice(-2).join(" ");

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <Header />
      
      {/* 1. Hero Section (Original Restored) */}
      <main className="relative overflow-hidden pt-16 pb-32 lg:pt-32">
        <div
          className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
          aria-hidden="true"
        >
          <div
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
            style={{
              clipPath:
                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
            }}
          ></div>
        </div>
        
        <FadeIn delay={100} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/50 px-3 py-1 text-sm font-medium text-indigo-600 mb-8 backdrop-blur-sm">
            <DynamicIcon name="Sparkles" size={16} />
            <span>{settings?.hero_badge || "Fast, Premium Logo Design"}</span>
          </div>
          <h1 className="mx-auto max-w-4xl text-5xl font-extrabold tracking-tight text-slate-900 sm:text-7xl leading-[1.1]">
            {heroTitleStart}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
              {heroTitleEnd}
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            {settings?.hero_description || "Professional logo design that speaks to your audience. We build visual identities that are memorable, scalable, and fast to deliver. Start your new chapter today."}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/shop" className="group w-full sm:w-auto flex h-12 items-center justify-center gap-2 rounded-full bg-indigo-600 px-8 text-base font-semibold text-white transition-all hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200 focus:ring-4 focus:ring-indigo-100">
              {settings?.cta_button1_text || "Order Your Logo"}
              <ArrowRight
                size={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
            <Link href="/#portfolio" className="flex w-full sm:w-auto h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-8 text-base font-semibold text-slate-900 transition-all hover:border-slate-300 hover:bg-slate-50 focus:ring-4 focus:ring-slate-100">
              {settings?.cta_button2_text || "View Portfolio"}
            </Link>
          </div>
        </FadeIn>

        {/* Features Preview */}
        <div className="mx-auto mt-20 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {featuresList.map((feature: any, idx: number) => (
              <FadeIn
                key={idx}
                delay={idx * 150}
                className="relative overflow-hidden rounded-3xl bg-slate-50 p-8 sm:p-10 transition-shadow hover:shadow-md h-full"
              >
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm text-indigo-600">
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

      {/* 2. Rating Card (Proof Section from original file) */}
      <section className="bg-white py-16 sm:py-24 border-t border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn delay={200} className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between rounded-3xl bg-slate-50 p-8 sm:p-12">
            
            {/* Left: Rating & Trust */}
            <div className="max-w-xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={18} fill="currentColor" strokeWidth={0} />
                  ))}
                </div>
                <span className="text-sm font-semibold text-slate-700">4.9/5 Average Rating</span>
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                {settings?.trusted_by_title || "Trusted by 5,000+ ambitious brands"}
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                {settings?.trusted_by_description || "From stealth startups to global enterprises, we deliver world-class visual identities that command attention."}
              </p>
              
              <div className="mt-8 flex items-center gap-x-4">
                <div className="flex -space-x-3">
                  {['A', 'J', 'S', 'M'].map((letter, i) => (
                    <div key={i} className="flex h-10 w-10 items-center justify-center rounded-full ring-2 ring-slate-50 bg-indigo-100 text-indigo-700 font-bold text-sm">
                      {letter}
                    </div>
                  ))}
                  <div className="flex h-10 w-10 items-center justify-center rounded-full ring-2 ring-slate-50 bg-white border border-slate-200 text-slate-600 font-medium text-xs">
                    +5k
                  </div>
                </div>
                <p className="text-sm text-slate-500 font-medium">{settings?.stats_title || "Join the club"}</p>
              </div>
            </div>
            
            {/* Right: Clean Stats Grid */}
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-2 lg:gap-12 pl-0 lg:pl-12 lg:border-l lg:border-slate-200">
              {statsList.map((stat: any, idx: number) => (
                <div key={idx} className="flex flex-col">
                  <span className="text-4xl font-bold tracking-tight text-slate-900">
                    {stat.value}
                    {stat.suffix && <span className="text-2xl text-slate-400">{stat.suffix}</span>}
                  </span>
                  <span className="mt-2 text-sm font-medium text-slate-500">{stat.label}</span>
                </div>
              ))}
            </div>
            
          </FadeIn>
        </div>
      </section>

      {/* 3. PortfolioGallery (Favorites only) */}
      <PortfolioGallery settings={settings} portfolios={portfoliosFav} />

      {/* 4. TestimonialSection */}
      <TestimonialSection settings={settings} testimonials={testimonials} />

      {/* 5. Pricing */}
      <Pricing settings={settings} featuredService={featuredService} />

      {/* 6. Steps */}
      <Steps settings={settings} />

      {/* 7. HighlightedPortfolio (All Newest Portfolios) */}
      <HighlightedPortfolio settings={settings} portfolios={portfoliosNew} />

      {/* 8. FAQSection */}
      <FAQSection 
        faqs={landingFaqs || []} 
        title={settings?.faq_title || "Frequently Asked Questions"}
        badge={settings?.faq_badge || "FAQ"}
      />

      {/* 9. CTA */}
      <CTA settings={settings} />

      {/* 10. Articles */}
      <Articles settings={settings} />

      <Footer />
    </div>
  );
}