BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  plan TEXT NOT NULL DEFAULT 'starter',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email CITEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  is_platform_admin BOOLEAN NOT NULL DEFAULT FALSE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS company_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('boss', 'manager', 'rep', 'back_office')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  manager_company_user_id UUID,
  phone TEXT NOT NULL CHECK (phone ~ '^\+977[0-9]{10}$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, user_id),
  UNIQUE (company_id, id)
);

ALTER TABLE company_users
  ADD CONSTRAINT fk_company_users_manager
  FOREIGN KEY (manager_company_user_id)
  REFERENCES company_users(id)
  ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_company_users_company_role
  ON company_users (company_id, role);

CREATE INDEX IF NOT EXISTS idx_company_users_company_manager
  ON company_users (company_id, manager_company_user_id);

CREATE TABLE IF NOT EXISTS shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  external_shop_code TEXT,
  name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  address TEXT,
  latitude DOUBLE PRECISION NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  geofence_radius_m INTEGER NOT NULL DEFAULT 60 CHECK (geofence_radius_m > 0 AND geofence_radius_m <= 500),
  location_source TEXT NOT NULL DEFAULT 'manual_pin'
    CHECK (location_source IN ('manual_pin', 'gps_capture', 'imported')),
  location_verified BOOLEAN NOT NULL DEFAULT FALSE,
  location_accuracy_m NUMERIC(7,2),
  arrival_prompt_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  min_dwell_seconds INTEGER NOT NULL DEFAULT 120 CHECK (min_dwell_seconds >= 0),
  cooldown_minutes INTEGER NOT NULL DEFAULT 30 CHECK (cooldown_minutes >= 0),
  timezone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, id),
  UNIQUE (company_id, external_shop_code)
);

CREATE INDEX IF NOT EXISTS idx_shops_company_active
  ON shops (company_id, is_active);

CREATE INDEX IF NOT EXISTS idx_shops_company_coords
  ON shops (company_id, latitude, longitude);

CREATE TABLE IF NOT EXISTS shop_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL,
  rep_company_user_id UUID NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, id),
  UNIQUE (company_id, shop_id, rep_company_user_id),
  FOREIGN KEY (company_id, shop_id) REFERENCES shops (company_id, id) ON DELETE CASCADE,
  FOREIGN KEY (company_id, rep_company_user_id) REFERENCES company_users (company_id, id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_shop_assignments_rep
  ON shop_assignments (company_id, rep_company_user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_shop_assignments_primary_per_shop
  ON shop_assignments (company_id, shop_id)
  WHERE is_primary = TRUE;

DROP TRIGGER IF EXISTS trg_companies_updated_at ON companies;
CREATE TRIGGER trg_companies_updated_at
BEFORE UPDATE ON companies
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_company_users_updated_at ON company_users;
CREATE TRIGGER trg_company_users_updated_at
BEFORE UPDATE ON company_users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_shops_updated_at ON shops;
CREATE TRIGGER trg_shops_updated_at
BEFORE UPDATE ON shops
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

COMMIT;

