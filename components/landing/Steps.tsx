import FadeIn from "./FadeIn";
import DynamicIcon from "../dashboard/DynamicIcon";

const defaultSteps = [
  { id: "01", name: "Konsultasi", description: "Ceritakan kebutuhan proyek Anda melalui WhatsApp. Kami akan merespons dalam hitungan menit.", icon: "MessageSquareText" },
  { id: "02", name: "Briefing", description: "Kami pahami visi Anda, target audiens, dan preferensi desain untuk menghasilkan konsep terbaik.", icon: "PenTool" },
  { id: "03", name: "Pengerjaan", description: "Tim kami mulai mengerjakan proyek sesuai timeline yang disepakati dengan update progres berkala.", icon: "RefreshCw" },
  { id: "04", name: "Selesai", description: "Proyek selesai, file lengkap dikirimkan. Kami siap membantu jika ada pertanyaan setelah itu.", icon: "Send" },
];

export default function Steps({ settings }: { settings?: any }) {
  const stepsList = settings?.process_list && settings.process_list.length > 0
    ? settings.process_list.map((step: any, i: number) => ({ ...step, id: String(i + 1).padStart(2, "0"), name: step.title, description: step.desc }))
    : defaultSteps;

  return (
    <section className="bg-white py-24 sm:py-32 overflow-hidden" id="process">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn delay={100} className="mx-auto max-w-2xl text-center mb-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary mb-4">
            <span>{settings?.process_badge || "Cara Kerja"}</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {settings?.process_title || "Proses sederhana, hasil luar biasa"}
          </h2>
          <p className="mt-4 text-lg text-slate-500">
            {settings?.process_description || "Kami telah menyederhanakan proses kerja agar Anda bisa fokus pada bisnis, bukan mengurus detail teknis."}
          </p>
        </FadeIn>

        <div className="relative">
          <div className="hidden lg:block absolute top-10 left-[calc(12.5%+28px)] right-[calc(12.5%+28px)] h-px">
            <div className="h-full border-t-2 border-dashed border-slate-200" />
          </div>

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-4 lg:gap-6">
            {stepsList.map((step: any, idx: number) => (
              <FadeIn key={idx} delay={150 + idx * 120}>
                <div className="group flex flex-col items-center text-center">

                  <div className="relative mb-6 z-10">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 shadow-sm group-hover:bg-primary group-hover:border-primary group-hover:shadow-lg group-hover:shadow-primary/20 transition-all duration-300">
                      <DynamicIcon name={step.icon} size={28} className="text-primary group-hover:text-white transition-colors duration-300" />
                    </div>
                    <span className="absolute -top-3 -right-3 w-7 h-7 flex items-center justify-center rounded-full bg-primary text-white text-xs font-extrabold shadow-md">
                      {step.id}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-primary transition-colors duration-300">
                    {step.name}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">
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