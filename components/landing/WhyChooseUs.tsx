import FadeIn from "./FadeIn";
import DynamicIcon from "@/components/dashboard/DynamicIcon";
import { CheckCircle2 } from "lucide-react";

export default function WhyChooseUs({ settings }: { settings?: any }) {
  const items: { title: string; desc: string; icon: string }[] =
    settings?.why_choose_us_list && settings.why_choose_us_list.length > 0
      ? settings.why_choose_us_list
      : [
          { title: "Desainer Berpengalaman", desc: "Tim kami terdiri dari desainer grafis profesional dengan pengalaman lebih dari 5 tahun di bidang branding dan identitas visual.", icon: "Award" },
          { title: "Proses Cepat & Efisien", desc: "Konsep awal logo Anda siap dalam 24 jam. Tidak perlu menunggu berminggu-minggu untuk mendapatkan identitas merek yang sempurna.", icon: "Rocket" },
          { title: "Revisi Tanpa Batas", desc: "Kami berkomitmen penuh hingga Anda benar-benar puas. Revisi sebanyak yang Anda butuhkan tanpa biaya tambahan.", icon: "RefreshCcw" },
          { title: "Harga Transparan", desc: "Tidak ada biaya tersembunyi. Semua paket sudah jelas termasuk file apa saja yang Anda dapatkan.", icon: "Shield" },
          { title: "File Lengkap & Siap Pakai", desc: "Anda menerima semua format: AI, EPS, PDF, PNG, SVG yang siap digunakan untuk web maupun cetak.", icon: "DownloadCloud" },
          { title: "Dukungan Purna Jual", desc: "Kami hadir setelah proyek selesai. Punya pertanyaan soal penggunaan logo? Kami selalu siap membantu.", icon: "Heart" },
        ];

  return (
    <section className="bg-white py-24 sm:py-32" id="kenapa-kami">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn delay={100} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-medium text-primary mb-4">
            <CheckCircle2 className="w-4 h-4" />
            <span>{settings?.why_choose_us_badge || "Kenapa Kami"}</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {settings?.why_choose_us_title || "Mengapa Memilih Kami?"}
          </h2>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            {settings?.why_choose_us_description || "Kami bukan sekadar jasa desain logo biasa. Kami adalah mitra branding yang berkomitmen membangun identitas visual terbaik untuk bisnis Anda."}
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((item, idx) => (
            <FadeIn key={idx} delay={100 + idx * 80}>
              <div className="group relative rounded-3xl bg-slate-50 p-8 hover:bg-indigo-50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 h-full border border-transparent hover:border-indigo-100">
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                  <DynamicIcon name={item.icon || "CheckCircle2"} size={22} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-secondary transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
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
