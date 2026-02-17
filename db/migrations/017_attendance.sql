BEGIN;

CREATE TABLE IF NOT EXISTS attendance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  rep_company_user_id UUID NOT NULL REFERENCES company_users(id) ON DELETE CASCADE,
  clock_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  clock_out_at TIMESTAMPTZ,
  clock_in_latitude DOUBLE PRECISION,
  clock_in_longitude DOUBLE PRECISION,
  clock_out_latitude DOUBLE PRECISION,
  clock_out_longitude DOUBLE PRECISION,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, id),
  FOREIGN KEY (company_id, rep_company_user_id) REFERENCES company_users(company_id, id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_attendance_company_rep ON attendance_logs (company_id, rep_company_user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_clock_in ON attendance_logs (company_id, clock_in_at DESC);

DROP TRIGGER IF EXISTS trg_attendance_logs_updated_at ON attendance_logs;
CREATE TRIGGER trg_attendance_logs_updated_at
BEFORE UPDATE ON attendance_logs
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

COMMIT;
