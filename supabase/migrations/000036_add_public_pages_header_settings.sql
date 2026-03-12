ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS shop_badge TEXT DEFAULT 'Produk Digital',
  ADD COLUMN IF NOT EXISTS shop_title TEXT DEFAULT 'Aset Premium',
  ADD COLUMN IF NOT EXISTS shop_description TEXT DEFAULT 'Unduh template, UI kit, set ikon, dan tema berkualitas tinggi untuk mempercepat alur kerja Anda.',
  ADD COLUMN IF NOT EXISTS testimonial_badge TEXT DEFAULT 'Ulasan Klien',
  ADD COLUMN IF NOT EXISTS testimonial_title TEXT DEFAULT 'Apa Kata Klien Kami',
  ADD COLUMN IF NOT EXISTS testimonial_description TEXT DEFAULT 'Umpan balik dan ulasan jujur dari klien-klien kami yang luar biasa di seluruh dunia.';
