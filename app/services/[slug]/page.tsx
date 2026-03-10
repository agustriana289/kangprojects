import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FadeIn from "@/components/landing/FadeIn";
import Pricing from "@/components/landing/Pricing";
import Link from "next/link";
import FAQSection from "@/components/landing/FAQSection";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, ChevronRight, Home } from "lucide-react";
import DynamicIcon from "@/components/dashboard/DynamicIcon";

interface ServiceProps {
  params: Promise<{ slug: string }>;
}

async function getService(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_services")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();
  return data;
}

export async function generateMetadata({ params }: ServiceProps): Promise<Metadata> {
  const { slug } = await params;
  const service = await getService(slug);
  if (!service) return { title: "Service Not Found" };
  return {
    title: service.title,
    description: service.description,
  };
}

export default async function ServiceDetail({ params }: ServiceProps) {
  const { slug } = await params;
  const service = await getService(slug);
  if (!service) notFound();

  // Create a minimal settings object for the Pricing component
  const mockSettings = {
    pricing_badge: service.category || "Pricing Plans",
    pricing_title: `Choose your ${service.title} plan`,
    pricing_description: "Select the package that best fits your requirements. All packages come with guaranteed quality and support.",
  };

  // Fetch active automated discounts
  const supabase = await createClient();
  const { data: discounts } = await supabase
    .from("store_discounts")
    .select("*")
    .eq("is_active", true)
    .is("code", null);

  const activeDiscounts = discounts || [];

  const { data: serviceFaqs } = await supabase
    .from("faqs")
    .select("*")
    .eq("target", "service")
    .eq("service_id", service.id)
    .eq("is_published", true)
    .order("sort_order", { ascending: true });

  // Fetch related portfolios based on portfolio_ids array
  let relatedPortfolios: any[] = [];
  if (service.portfolio_ids && service.portfolio_ids.length > 0) {
    const { data: ports } = await supabase
      .from("store_portfolios")
      .select("id, title, description, category, images")
      .in("id", service.portfolio_ids)
      .eq("is_published", true);
      
    if (ports && ports.length > 0) {
      // Map to maintain the order defined in portfolio_ids
      relatedPortfolios = service.portfolio_ids
        .map((id: string) => ports.find(p => p.id === id))
        .filter(Boolean);
    }
  }

  // Fetch settings for the WhatsApp CTA (id=1)
  const { data: settings } = await supabase.from("settings").select("*").eq("id", 1).single();
  const whatsappNumber = settings?.phone_number ? settings.phone_number.replace(/\D/g, "") : "";

  return (
    <div className="min-h-screen font-sans text-slate-900">
      <Header />
      
      

      <div className="py-4 pt-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm text-slate-500 font-medium">
              <li>
                <Link href="/" className="hover:text-primary transition-colors">
                  <Home className="h-4 w-4" />
                  <span className="sr-only">Home</span>
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                  <Link href="/services" className="ml-2 hover:text-primary transition-colors">
                    Services
                  </Link>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                  <span className="ml-2 text-slate-800" aria-current="page">
                    {service.title}
                  </span>
                </div>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <main className="py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16">
            
            

            <FadeIn delay={100} className="flex flex-col">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-medium text-primary mb-6 w-max">
                <BriefcaseBusiness size={14} />
                <span>{service.category || "Service"}</span>
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl mb-6">
                {service.title}
              </h1>
              
              

              <div 
                className="prose prose-slate prose-lg max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary hover:prose-a:text-primary mb-12 whitespace-pre-wrap"
              >
                {service.description}
              </div>
              

              {service.key_features && service.key_features.length > 0 && (
                <div className="mt-auto space-y-4">
                  {service.key_features.map((kf: any, idx: number) => (
                    <div key={idx} className="bg-slate-50 rounded-2xl p-6 ring-1 ring-slate-100/80 shadow-sm border border-slate-100 flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-primary shadow-sm shrink-0">
                        <DynamicIcon name={kf.icon || "CheckCircle2"} size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 leading-tight">{kf.title}</h3>
                        <p className="text-sm text-slate-500">{kf.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </FadeIn>

            

            <FadeIn delay={200} className="mt-12 lg:mt-0">
              <div className="overflow-hidden rounded-3xl bg-slate-100 ring-1 ring-slate-200 shadow-2xl sticky top-24">
                {service.thumbnail_url ? (
                  <img
                    src={service.thumbnail_url}
                    alt={service.title}
                    className="w-full h-full object-cover aspect-[4/3]"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full aspect-[4/3] bg-slate-100 text-slate-400">
                    <BriefcaseBusiness size={48} />
                  </div>
                )}
              </div>
            </FadeIn>

          </div>
        </div>
      </main>

      <Pricing settings={mockSettings} featuredService={service} activeDiscounts={activeDiscounts} />

      {/* RELATED PORTFOLIOS SECTION */}
      {relatedPortfolios.length > 0 && (
        <section className="py-20 bg-slate-50 relative border-t border-slate-100">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <FadeIn>
              <div className="text-center max-w-2xl mx-auto mb-16">
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-medium text-primary mb-6">
                  <BriefcaseBusiness size={14} />
                  <span>Work Samples</span>
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                  {service.title} Portfolios
                </h2>
                <p className="mt-4 text-lg text-slate-600">
                  Take a look at some of our selected projects for this service.
                </p>
              </div>
            </FadeIn>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {relatedPortfolios.map((portfolio, idx) => (
                <FadeIn key={portfolio.id} delay={150 + idx * 80}>
                  <article className="group relative flex flex-col bg-white rounded-3xl ring-1 ring-slate-100/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden h-full">
                    <div className="relative aspect-square overflow-hidden bg-slate-100">
                      {portfolio.images && portfolio.images.length > 0 ? (
                        <img
                          src={portfolio.images[0]}
                          alt={portfolio.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <BriefcaseBusiness className="w-10 h-10" />
                        </div>
                      )}
                      {portfolio.category && (
                        <div className="absolute top-4 left-4 flex flex-wrap gap-1">
                          <span className="rounded-full bg-white/90 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-slate-900 shadow-sm">
                            {portfolio.category.trim()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col flex-1 p-6">
                      <h3 className="text-xl font-bold text-slate-900 leading-snug mb-3 group-hover:text-primary transition-colors">
                        {portfolio.title}
                      </h3>
                      {portfolio.description && (
                        <p className="text-sm text-slate-500 leading-relaxed line-clamp-3 flex-1">
                          {portfolio.description}
                        </p>
                      )}
                    </div>
                  </article>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      )}

      <FAQSection 
        faqs={serviceFaqs || []} 
        title={`Questions about ${service.title}`}
        badge="Service FAQ"
      />

      {/* CTA SECTION - Standardized with Landing Page Style */}
      <section className="bg-white py-16 sm:py-24" id="cta">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn delay={100}>
            <div className="relative isolate overflow-hidden bg-slate-900 px-6 py-24 text-center shadow-2xl rounded-3xl sm:px-16">
              <h2 className="mx-auto max-w-2xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
                Ready to start your <span className="text-indigo-400">{service.title}</span> project?
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-slate-300">
                Consult with our experts today. We are here to help you turn your visions into reality and get your initial concepts in as little as 24 hours.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6">
                <a 
                  href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hi, saya ingin berkonsultasi mengenai layanan ${service.title} di website kanglogo.com.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-center gap-2 rounded-full bg-indigo-500 px-8 py-4 text-base font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-1 w-full sm:w-auto"
                >
                  Consult via WhatsApp
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                </a>
                <Link 
                  href="/#pricing" 
                  className="flex items-center justify-center gap-2 text-base font-semibold leading-6 text-white transition-colors hover:text-indigo-400 w-full sm:w-auto py-2"
                >
                  View Pricing Plans
                </Link>
              </div>
              
              <svg
                viewBox="0 0 1024 1024"
                className="absolute left-1/2 top-1/2 -z-10 h-256 w-5xl -translate-x-1/2 mask-[radial-gradient(closest-side,white,transparent)]"
                aria-hidden="true"
              >
                <circle cx={512} cy={512} r={512} fill="url(#gradient-service)" fillOpacity="0.7" />
                <defs>
                  <radialGradient id="gradient-service">
                    <stop stopColor="#818cf8" />
                    <stop offset={1} stopColor="#4338ca" />
                  </radialGradient>
                </defs>
              </svg>
            </div>
          </FadeIn>
        </div>
      </section>

      <Footer />
    </div>
  );
}