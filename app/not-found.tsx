import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <Header />

      <main className="relative overflow-hidden">
        <div
          className="absolute inset-x-0 top-0 -z-10 transform-gpu overflow-hidden blur-3xl"
          aria-hidden="true"
        >
          <div
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
            style={{
              clipPath:
                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
            }}
          />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-32 lg:py-48 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/50 px-3 py-1 text-sm font-medium text-primary mb-8 backdrop-blur-sm">
            <Search size={16} />
            <span>Halaman Tidak Ditemukan</span>
          </div>

          <p className="text-8xl sm:text-9xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 leading-none mb-6">
            404
          </p>

          <h1 className="mx-auto max-w-2xl text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-4">
            Oops! Halaman tidak ditemukan
          </h1>

          <p className="mx-auto max-w-xl text-lg text-slate-500 leading-relaxed mb-10">
            Halaman yang Anda cari mungkin telah dipindahkan, dihapus, atau tidak pernah ada. Mari kami bantu Anda kembali ke jalur yang benar.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/"
              className="group flex h-12 items-center justify-center gap-2 rounded-full bg-indigo-600 px-8 text-base font-semibold text-white transition-all hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200 focus:ring-4 focus:ring-indigo-100"
            >
              <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
              Kembali ke Beranda
            </Link>
            <Link
              href="/blog"
              className="flex h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-8 text-base font-semibold text-slate-900 transition-all hover:border-slate-300 hover:bg-slate-50 focus:ring-4 focus:ring-slate-100"
            >
              Jelajahi Artikel
            </Link>
          </div>

          <div className="mt-20 grid grid-cols-1 gap-6 sm:grid-cols-3 max-w-3xl mx-auto">
            <Link
              href="/#portfolio"
              className="relative overflow-hidden rounded-3xl bg-slate-50 p-6 text-left transition-shadow hover:shadow-md"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">Portofolio</p>
              <p className="text-sm font-semibold text-slate-900">Lihat Karya Kami</p>
              <p className="text-xs text-slate-500 mt-1">Jelajahi desain logo yang kami buat</p>
            </Link>
            <Link
              href="/#pricing"
              className="relative overflow-hidden rounded-3xl bg-slate-50 p-6 text-left transition-shadow hover:shadow-md"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">Harga</p>
              <p className="text-sm font-semibold text-slate-900">Paket Kami</p>
              <p className="text-xs text-slate-500 mt-1">Temukan paket yang sesuai merek Anda</p>
            </Link>
            <Link
              href="/blog"
              className="relative overflow-hidden rounded-3xl bg-slate-50 p-6 text-left transition-shadow hover:shadow-md"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">Blog</p>
              <p className="text-sm font-semibold text-slate-900">Baca Artikel</p>
              <p className="text-xs text-slate-500 mt-1">Tips desain & wawasan branding</p>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}