-- System Database Schema (sys.db)
-- Manages Accounts, Auth, World Metadata, and Billing/Usage.

-- Accounts Table
-- kb_accounts: Knowledge Base Accounts
-- Maps to SDK 'WorldsAccount' (id, description, plan)
CREATE TABLE IF NOT EXISTS kb_accounts (
  account_id TEXT PRIMARY KEY,
  description TEXT,
  plan TEXT NOT NULL DEFAULT 'free', -- 'free' | 'pro'
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- API Keys Table
-- kb_api_keys: Service Account Credentials
-- Securely stores hashed API keys linked to accounts.
CREATE TABLE IF NOT EXISTS kb_api_keys (
  key_hash TEXT PRIMARY KEY, -- SHA-256 hash of the key
  account_id TEXT NOT NULL,
  key_prefix TEXT NOT NULL, -- First 8 chars for identification
  name TEXT, -- e.g. "CI/CD Pipeline"
  created_at INTEGER NOT NULL,
  expires_at INTEGER,
  FOREIGN KEY(account_id) REFERENCES kb_accounts(account_id) ON DELETE CASCADE
);

-- Index for fast lookup by account
CREATE INDEX IF NOT EXISTS kb_ak_account_idx ON kb_api_keys (account_id);

-- Worlds Metadata Table
-- kb_worlds: Knowledge Base Worlds
-- Maps World IDs to Accounts and stores high-level metadata.
CREATE TABLE IF NOT EXISTS kb_worlds (
  world_id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER, -- Soft delete support
  is_public INTEGER DEFAULT 0,
  FOREIGN KEY(account_id) REFERENCES kb_accounts(account_id) ON DELETE CASCADE
);

-- Index for lookup by account
CREATE INDEX IF NOT EXISTS kb_w_account_idx ON kb_worlds (account_id);

-- Usage Monitoring
-- kb_usage: Knowledge Base Usage Buckets
-- Aggregates usage metrics for billing.
CREATE TABLE IF NOT EXISTS kb_usage (
  bucket_start_ts INTEGER NOT NULL,
  account_id TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 0,
  token_in_count INTEGER DEFAULT 0,
  token_out_count INTEGER DEFAULT 0,
  PRIMARY KEY (bucket_start_ts, account_id, endpoint),
  FOREIGN KEY(account_id) REFERENCES kb_accounts(account_id) ON DELETE CASCADE
);

-- Dynamic Access Control / Plan Definitions
-- kb_limits: Knowledge Base Limits
-- Defines quotas and features for each plan tier.
CREATE TABLE IF NOT EXISTS kb_limits (
  plan TEXT PRIMARY KEY, -- 'free', 'pro'
  quota_requests_per_min INTEGER DEFAULT 60,
  quota_storage_bytes INTEGER DEFAULT 104857600, -- 100MB
  allow_reasoning INTEGER DEFAULT 0 -- Boolean
);
