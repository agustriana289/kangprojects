INSERT INTO public.app_settings (key, value) VALUES
    ('notion_enabled', 'false'),
    ('notion_token', NULL),
    ('notion_projects_db_id', NULL),
    ('notion_market_db_id', NULL),
    ('notion_last_sync_projects_at', NULL),
    ('notion_last_sync_market_at', NULL)
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.store_orders ADD COLUMN IF NOT EXISTS notion_page_id TEXT;
ALTER TABLE public.store_orders ADD COLUMN IF NOT EXISTS notion_market_page_id TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_notion_page_id ON public.store_orders(notion_page_id);
CREATE INDEX IF NOT EXISTS idx_orders_notion_market_page_id ON public.store_orders(notion_market_page_id);
