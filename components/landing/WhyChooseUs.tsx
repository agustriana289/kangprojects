import FadeIn from "./FadeIn";
import DynamicIcon from "@/components/dashboard/DynamicIcon";
import { CheckCircle2 } from "lucide-react";

export default function WhyChooseUs({ settings }: { settings?: any }) {
  const items: { title: string; desc: string; icon: string }[] =
    settings?.why_choose_us_list && settings.why_choose_us_list.length > 0
      ? settings.why_choose_us_list
      : [
          { title: "Desainer Berpengalaman", desc: "Tim ahli dengan rekam jejak terbukti dalam menciptakan identitas visual yang ikonik dan tak lekang oleh waktu.", icon: "Award" },
          { title: "Pengiriman Super Cepat", desc: "Dapatkan konsep awal dalam 24 jam. Proses kami dioptimalkan untuk kecepatan tanpa mengorbankan kualitas.", icon: "Zap" },
          { title: "Revisi Tanpa Batas", desc: "Kepuasan Anda adalah prioritas utama. Kami akan terus menyempurnakan desain hingga Anda benar-benar puas.", icon: "RefreshCcw" },
          { title: "Harga Transparan", desc: "Tidak ada biaya tersembunyi. Anda tahu persis apa yang Anda bayar dan apa yang akan Anda dapatkan.", icon: "ShieldCheck" },
          { title: "Aset Lengkap", desc: "Terima file sumber asli (AI, EPS, SVG, PNG, JPG) yang siap digunakan untuk semua kebutuhan cetak dan digital.", icon: "DownloadCloud" },
          { title: "Dukungan Prioritas", desc: "Tim dukungan pelanggan kami siap membantu Anda kapan saja, bahkan setelah proyek dinyatakan selesai.", icon: "Headphones" },
        ];

  return (
    <section className="bg-slate-50 py-24 sm:py-32" id="kenapa-kami">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn delay={100} className="mx-auto max-w-3xl text-center mb-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-600 mb-6 shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span>{settings?.why_choose_us_badge || "Keunggulan Kami"}</span>
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            {settings?.why_choose_us_title || "Mengapa bisnis memilih kami"}
          </h2>
          <p className="mt-6 text-lg leading-8 text-slate-500">
            {settings?.why_choose_us_description || "Kami menggabungkan kreativitas tingkat tinggi dengan proses kerja yang efisien untuk memberikan hasil terbaik bagi bisnis Anda."}
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, idx) => (
            <FadeIn key={idx} delay={150 + idx * 100}>
              <div className="group relative rounded-3xl bg-white p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-300 h-full">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 text-slate-700 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all duration-300">
                  <DynamicIcon name={item.icon || "CheckCircle2"} size={24} />
                </div>
                <h3 className="text-xl font-bold tracking-tight text-slate-900 mb-3 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-base text-slate-500 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
