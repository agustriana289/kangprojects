-- 000054_add_notion_market_products.sql

ALTER TABLE public.store_products ADD COLUMN IF NOT EXISTS notion_market_page_id TEXT;
CREATE INDEX IF NOT EXISTS idx_products_notion_page_id ON public.store_products(notion_market_page_id);
