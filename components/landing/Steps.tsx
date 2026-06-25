import FadeIn from "./FadeIn";
import DynamicIcon from "../dashboard/DynamicIcon";

const defaultSteps = [
  { id: "1", name: "Konsultasi Awal", description: "Hubungi kami via WhatsApp untuk diskusi singkat mengenai visi dan kebutuhan spesifik proyek Anda.", icon: "MessageSquareText" },
  { id: "2", name: "Ideasi & Konsep", description: "Tim desainer kami akan mengembangkan beberapa konsep awal yang relevan dalam waktu 24 jam.", icon: "Lightbulb" },
  { id: "3", name: "Revisi Detail", description: "Kami berkolaborasi dengan Anda untuk menyempurnakan desain hingga mencapai hasil yang sempurna.", icon: "PenTool" },
  { id: "4", name: "Penyerahan Aset", description: "Anda akan menerima semua file master resolusi tinggi yang siap digunakan untuk berbagai keperluan.", icon: "FolderOpen" },
];

export default function Steps({ settings }: { settings?: any }) {
  const stepsList = settings?.process_list && settings.process_list.length > 0
    ? settings.process_list.map((step: any, i: number) => ({ ...step, id: String(i + 1), name: step.title, description: step.desc }))
    : defaultSteps;

  return (
    <section className="bg-white py-24 sm:py-32" id="process">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn delay={100} className="mx-auto max-w-3xl text-center mb-24">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-600 mb-6 shadow-sm">
            <span>{settings?.process_badge || "Cara Kerja"}</span>
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            {settings?.process_title || "Langkah mudah menuju hasil terbaik"}
          </h2>
          <p className="mt-6 text-lg leading-8 text-slate-500">
            {settings?.process_description || "Proses kerja kami dirancang untuk meniadakan hambatan, sehingga Anda mendapatkan hasil berkualitas tinggi dengan cepat."}
          </p>
        </FadeIn>

        <div className="space-y-24">
          {stepsList.map((step: any, idx: number) => {
            const isEven = idx % 2 === 1;
            return (
              <div key={idx} className={`flex flex-col gap-12 lg:items-center ${isEven ? 'lg:flex-row-reverse' : 'lg:flex-row'}`}>
                {/* Content Side */}
                <div className="w-full lg:w-1/2">
                  <FadeIn delay={150}>
                    <div className="flex flex-col max-w-md mx-auto lg:mx-0">
                      <span className="text-6xl font-light text-slate-200 mb-4 block">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <h3 className="text-3xl font-bold tracking-tight text-slate-900 mb-4">
                        {step.name}
                      </h3>
                      <p className="text-lg text-slate-500 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </FadeIn>
                </div>
                
                {/* Graphic/Visual Side */}
                <div className="w-full lg:w-1/2">
                  <FadeIn delay={250}>
                    <div className="relative aspect-[4/3] rounded-[2rem] bg-gradient-to-br from-purple-50 to-orange-50/30 overflow-hidden flex items-center justify-center border border-slate-100 shadow-sm">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.8)_0%,transparent_100%)]"></div>
                      <div className="relative z-10 w-24 h-24 rounded-3xl bg-white shadow-xl flex items-center justify-center text-primary rotate-3 hover:rotate-0 transition-transform duration-500">
                         <DynamicIcon name={step.icon || "Sparkles"} size={40} />
                      </div>
                    </div>
                  </FadeIn>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}