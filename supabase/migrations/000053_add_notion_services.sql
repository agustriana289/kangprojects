INSERT INTO public.app_settings (key, value) VALUES
    ('notion_services_db_id', NULL),
    ('notion_last_sync_services_at', NULL)
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.store_services ADD COLUMN IF NOT EXISTS notion_service_page_id TEXT;

CREATE INDEX IF NOT EXISTS idx_services_notion_page_id ON public.store_services(notion_service_page_id);
