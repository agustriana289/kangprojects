ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS hero_button1_text TEXT DEFAULT 'Pesan Logo Anda',
  ADD COLUMN IF NOT EXISTS hero_button1_url TEXT DEFAULT '/shop',
  ADD COLUMN IF NOT EXISTS hero_button2_text TEXT DEFAULT 'Lihat Portofolio',
  ADD COLUMN IF NOT EXISTS hero_button2_url TEXT DEFAULT '/#portfolio',
  ADD COLUMN IF NOT EXISTS cta_button1_url TEXT DEFAULT '/shop',
  ADD COLUMN IF NOT EXISTS cta_button2_url TEXT DEFAULT '/contact';

UPDATE settings
SET
  hero_button1_text = COALESCE(cta_button1_text, 'Pesan Logo Anda'),
  hero_button1_url  = '/shop',
  hero_button2_text = COALESCE(cta_button2_text, 'Lihat Portofolio'),
  hero_button2_url  = '/#portfolio',
  cta_button1_url   = '/shop',
  cta_button2_url   = '/contact'
WHERE id = 1;
