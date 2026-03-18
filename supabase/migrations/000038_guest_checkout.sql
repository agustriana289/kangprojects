ALTER TABLE public.store_orders
  ADD COLUMN IF NOT EXISTS guest_name TEXT,
  ADD COLUMN IF NOT EXISTS guest_phone TEXT;

DROP POLICY IF EXISTS "Guest can insert orders" ON public.store_orders;
CREATE POLICY "Guest can insert orders" ON public.store_orders
  FOR INSERT TO public
  WITH CHECK (
    (auth.uid() IS NULL AND user_id IS NULL AND guest_phone IS NOT NULL)
    OR
    (auth.uid() = user_id)
  );
