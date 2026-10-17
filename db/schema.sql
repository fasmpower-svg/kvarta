CREATE TABLE IF NOT EXISTS leads (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  phone         TEXT    NOT NULL,
  interest      TEXT    NOT NULL,
  comment       TEXT,
  utm_source    TEXT,
  utm_medium    TEXT,
  utm_campaign  TEXT,
  utm_content   TEXT,
  utm_term      TEXT,
  click_id      TEXT,
  referrer      TEXT,
  page_url      TEXT,
  user_agent    TEXT,
  created_at_ms INTEGER NOT NULL,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_leads_phone_created
  ON leads (phone, created_at_ms DESC);
