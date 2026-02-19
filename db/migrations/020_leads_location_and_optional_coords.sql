BEGIN;

-- Add location support to leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION CHECK (latitude BETWEEN -90 AND 90);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION CHECK (longitude BETWEEN -180 AND 180);

-- Make coordinates optional for shops
ALTER TABLE shops ALTER COLUMN latitude DROP NOT NULL;
ALTER TABLE shops ALTER COLUMN longitude DROP NOT NULL;

COMMIT;
