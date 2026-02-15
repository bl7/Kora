BEGIN;

ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS notes TEXT;

COMMENT ON COLUMN shops.notes IS 'Free-form notes about the shop.';

COMMIT;
