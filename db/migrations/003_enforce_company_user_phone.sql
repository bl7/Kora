BEGIN;

-- Backfill missing/invalid phone values so we can safely enforce strict constraints.
WITH targets AS (
  SELECT
    id,
    ROW_NUMBER() OVER (ORDER BY created_at, id) AS rn
  FROM company_users
  WHERE phone IS NULL
     OR phone !~ '^\+977[0-9]{10}$'
),
normalized AS (
  SELECT
    id,
    '+97798' || LPAD(rn::text, 8, '0') AS generated_phone
  FROM targets
)
UPDATE company_users cu
SET phone = normalized.generated_phone
FROM normalized
WHERE cu.id = normalized.id;

ALTER TABLE company_users
  ALTER COLUMN phone SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'company_users_phone_nepal_format'
  ) THEN
    ALTER TABLE company_users
      ADD CONSTRAINT company_users_phone_nepal_format
      CHECK (phone ~ '^\+977[0-9]{10}$');
  END IF;
END$$;

COMMIT;

