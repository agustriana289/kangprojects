-- Tambahkan kolom portfolio_ids UUID array pada tabel store_services untuk menampung portofolio pilihan
ALTER TABLE public.store_services ADD COLUMN IF NOT EXISTS portfolio_ids UUID[] DEFAULT '{}';
