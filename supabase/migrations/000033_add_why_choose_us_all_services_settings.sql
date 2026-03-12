ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS why_choose_us_badge text DEFAULT 'Kenapa Kami',
ADD COLUMN IF NOT EXISTS why_choose_us_title text DEFAULT 'Mengapa Memilih Kami?',
ADD COLUMN IF NOT EXISTS why_choose_us_description text DEFAULT 'Kami bukan sekadar jasa desain logo biasa. Kami adalah mitra branding yang berkomitmen membangun identitas visual terbaik untuk bisnis Anda.',
ADD COLUMN IF NOT EXISTS why_choose_us_list jsonb DEFAULT '[
  {"title": "Desainer Berpengalaman", "desc": "Tim kami terdiri dari desainer grafis profesional dengan pengalaman lebih dari 5 tahun di bidang branding dan identitas visual.", "icon": "Award"},
  {"title": "Proses Cepat & Efisien", "desc": "Konsep awal logo Anda siap dalam 24 jam. Tidak perlu menunggu berminggu-minggu untuk mendapatkan identitas merek yang sempurna.", "icon": "Rocket"},
  {"title": "Revisi Tanpa Batas", "desc": "Kami berkomitmen penuh hingga Anda benar-benar puas. Revisi sebanyak yang Anda butuhkan tanpa biaya tambahan.", "icon": "RefreshCcw"},
  {"title": "Harga Transparan", "desc": "Tidak ada biaya tersembunyi. Semua paket sudah jelas termasuk file apa saja yang Anda dapatkan.", "icon": "Shield"},
  {"title": "File Lengkap & Siap Pakai", "desc": "Anda menerima semua format: AI, EPS, PDF, PNG, SVG yang siap digunakan untuk web maupun cetak.", "icon": "DownloadCloud"},
  {"title": "Dukungan Purna Jual", "desc": "Kami hadir setelah proyek selesai. Punya pertanyaan soal penggunaan logo? Kami selalu siap membantu.", "icon": "Heart"}
]'::jsonb,
ADD COLUMN IF NOT EXISTS all_services_badge text DEFAULT 'Layanan Kami',
ADD COLUMN IF NOT EXISTS all_services_title text DEFAULT 'Semua Layanan',
ADD COLUMN IF NOT EXISTS all_services_description text DEFAULT 'Temukan paket desain yang paling sesuai dengan kebutuhan bisnis Anda.';
