BEGIN;

-- Visits: rep checks in at a shop, can end later
CREATE TABLE IF NOT EXISTS visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL,
  rep_company_user_id UUID NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, id),
  FOREIGN KEY (company_id, shop_id) REFERENCES shops(company_id, id) ON DELETE CASCADE,
  FOREIGN KEY (company_id, rep_company_user_id) REFERENCES company_users(company_id, id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_visits_company_shop ON visits (company_id, shop_id);
CREATE INDEX IF NOT EXISTS idx_visits_company_rep ON visits (company_id, rep_company_user_id);
CREATE INDEX IF NOT EXISTS idx_visits_started_at ON visits (company_id, started_at DESC);

-- Tasks: assigned to reps (e.g. call back, follow-up)
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  rep_company_user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  shop_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, id),
  FOREIGN KEY (company_id, rep_company_user_id) REFERENCES company_users(company_id, id) ON DELETE CASCADE,
  FOREIGN KEY (company_id, shop_id) REFERENCES shops(company_id, id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_tasks_company_rep ON tasks (company_id, rep_company_user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks (company_id, status);

COMMIT;
