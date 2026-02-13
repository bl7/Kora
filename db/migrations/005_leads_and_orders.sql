BEGIN;

-- ── Leads ──
-- A lead is a potential customer (shop) that hasn't ordered yet.
-- When an order is placed for a lead, it auto-converts to 'customer'.

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  shop_id UUID,
  name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
  assigned_rep_company_user_id UUID,
  notes TEXT,
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (company_id, shop_id) REFERENCES shops(company_id, id) ON DELETE SET NULL,
  FOREIGN KEY (company_id, assigned_rep_company_user_id)
    REFERENCES company_users(company_id, id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_leads_company_status
  ON leads (company_id, status);

CREATE INDEX IF NOT EXISTS idx_leads_company_rep
  ON leads (company_id, assigned_rep_company_user_id);

DROP TRIGGER IF EXISTS trg_leads_updated_at ON leads;
CREATE TRIGGER trg_leads_updated_at
BEFORE UPDATE ON leads
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- ── Orders ──

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  shop_id UUID,
  lead_id UUID,
  placed_by_company_user_id UUID,
  status TEXT NOT NULL DEFAULT 'received'
    CHECK (status IN ('received', 'processing', 'shipped', 'closed')),
  notes TEXT,
  total_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency_code CHAR(3) NOT NULL DEFAULT 'NPR',
  placed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, order_number),
  FOREIGN KEY (company_id, shop_id) REFERENCES shops(company_id, id) ON DELETE SET NULL,
  FOREIGN KEY (company_id, placed_by_company_user_id)
    REFERENCES company_users(company_id, id) ON DELETE SET NULL
);

-- lead_id is a simple FK (not composite) since leads.id is globally unique
ALTER TABLE orders
  ADD CONSTRAINT fk_orders_lead
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_company_status
  ON orders (company_id, status);

CREATE INDEX IF NOT EXISTS idx_orders_company_shop
  ON orders (company_id, shop_id);

CREATE INDEX IF NOT EXISTS idx_orders_company_placed_at
  ON orders (company_id, placed_at DESC);

-- Composite unique needed for order_items FK
ALTER TABLE orders ADD CONSTRAINT uq_orders_company_id UNIQUE (company_id, id);

DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- ── Order Items ──

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  order_id UUID NOT NULL,
  product_id UUID,
  product_name TEXT NOT NULL,
  product_sku TEXT,
  quantity NUMERIC(12,3) NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
  line_total NUMERIC(14,2) NOT NULL GENERATED ALWAYS AS (quantity * unit_price) STORED,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (company_id, order_id) REFERENCES orders(company_id, id) ON DELETE CASCADE,
  FOREIGN KEY (company_id, product_id) REFERENCES products(company_id, id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_order_items_order
  ON order_items (company_id, order_id);

COMMIT;

