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
    <section className="bg-slate-50 py-24 sm:py-32" id="process">
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

        <div className="relative">
          {/* Connecting Line (Desktop Only) */}
          <div className="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-slate-200"></div>

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-4 lg:gap-8">
            {stepsList.map((step: any, idx: number) => (
              <FadeIn key={idx} delay={150 + idx * 100} className="relative z-10">
                <div className="group flex flex-col items-center text-center">

                  <div className="relative mb-8 flex h-16 w-16 items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm text-slate-900 group-hover:border-primary group-hover:text-primary transition-colors duration-300">
                    <span className="text-xl font-bold">{step.id}</span>
                  </div>

                  <h3 className="text-xl font-bold tracking-tight text-slate-900 mb-3 group-hover:text-primary transition-colors duration-300">
                    {step.name}
                  </h3>
                  <p className="text-base text-slate-500 leading-relaxed max-w-[250px] mx-auto">
                    {step.description}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}