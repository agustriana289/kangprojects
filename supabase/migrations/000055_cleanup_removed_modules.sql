ALTER TABLE public.store_orders DROP COLUMN IF EXISTS notion_page_id;
ALTER TABLE public.store_orders DROP COLUMN IF EXISTS notion_market_page_id;
ALTER TABLE public.store_orders DROP COLUMN IF EXISTS ticktick_task_id;

DROP INDEX IF EXISTS idx_orders_notion_page_id;
DROP INDEX IF EXISTS idx_orders_notion_market_page_id;

ALTER TABLE public.store_services DROP COLUMN IF EXISTS notion_service_page_id;
ALTER TABLE public.store_services DROP COLUMN IF EXISTS portfolio_ids;

DROP INDEX IF EXISTS idx_services_notion_page_id;

ALTER TABLE public.store_products DROP COLUMN IF EXISTS notion_market_page_id;

DROP INDEX IF EXISTS idx_products_notion_page_id;

DELETE FROM public.app_settings WHERE key IN (
    'notion_enabled',
    'notion_token',
    'notion_projects_db_id',
    'notion_market_db_id',
    'notion_last_sync_projects_at',
    'notion_last_sync_market_at',
    'notion_services_db_id',
    'notion_last_sync_services_at',
    'ticktick_access_token',
    'ticktick_refresh_token',
    'ticktick_project_id',
    'ticktick_token_expires_at',
    'ticktick_enabled'
);

DROP TABLE IF EXISTS public.user_presence CASCADE;
