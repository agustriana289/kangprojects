CREATE TABLE IF NOT EXISTS order_additional_charges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES store_orders(id) ON DELETE CASCADE,
  description TEXT NOT NULL DEFAULT '',
  amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE order_additional_charges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on additional charges"
  ON order_additional_charges
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = true
    )
  );

CREATE INDEX IF NOT EXISTS idx_additional_charges_order_id ON order_additional_charges(order_id);
