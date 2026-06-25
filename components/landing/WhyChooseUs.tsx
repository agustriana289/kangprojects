import FadeIn from "./FadeIn";
import DynamicIcon from "@/components/dashboard/DynamicIcon";
import { CheckCircle2 } from "lucide-react";

export default function WhyChooseUs({ settings }: { settings?: any }) {
  const items: { title: string; desc: string; icon: string }[] =
    settings?.why_choose_us_list && settings.why_choose_us_list.length > 0
      ? settings.why_choose_us_list
      : [
          { title: "Desainer Berpengalaman", desc: "Tim kami terdiri dari desainer grafis profesional dengan pengalaman lebih dari 5 tahun.", icon: "Award" },
          { title: "Proses Cepat & Efisien", desc: "Konsep awal siap dalam 24 jam. Tidak perlu menunggu berminggu-minggu.", icon: "Rocket" },
          { title: "Revisi Tanpa Batas", desc: "Kami berkomitmen penuh hingga Anda benar-benar puas.", icon: "RefreshCcw" },
          { title: "Harga Transparan", desc: "Tidak ada biaya tersembunyi. Semua paket sudah jelas.", icon: "Shield" },
          { title: "File Lengkap & Siap Pakai", desc: "Anda menerima semua format: AI, EPS, PDF, PNG, SVG.", icon: "DownloadCloud" },
          { title: "Dukungan Purna Jual", desc: "Kami hadir setelah proyek selesai untuk mendukung Anda.", icon: "Heart" },
        ];

  return (
    <section className="bg-white py-24 sm:py-32" id="kenapa-kami">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

          <FadeIn delay={100}>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary mb-5 w-max">
              <CheckCircle2 className="w-4 h-4" />
              <span>{settings?.why_choose_us_badge || "Kenapa Kami"}</span>
            </div>
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl leading-tight mb-6">
              {settings?.why_choose_us_title || "Mengapa bisnis tumbuh bersama kami?"}
            </h2>
            <p className="text-lg text-slate-500 leading-relaxed mb-8">
              {settings?.why_choose_us_description || "Kami bukan sekadar jasa desain biasa. Kami adalah mitra branding yang berkomitmen membangun identitas visual terbaik untuk bisnis Anda — cepat, berkualitas, dan harga transparan."}
            </p>
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-9 h-9 rounded-full bg-primary/10 border-2 border-white flex items-center justify-center text-primary text-xs font-bold">
                    {["A","B","C","D"][i]}
                  </div>
                ))}
              </div>
              <p className="text-sm font-medium text-slate-500">
                Bergabung bersama ratusan klien puas
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={200}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="group flex items-start gap-4 p-5 rounded-2xl bg-slate-50 hover:bg-primary/5 border border-transparent hover:border-primary/15 transition-all duration-300 hover:-translate-y-0.5"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                    <DynamicIcon name={item.icon || "CheckCircle2"} size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>

        </div>
      </div>
    </section>
  );
}
