export { default as systemSchema } from "./system.sql" with { type: "text" };

/**
 * AccountRow represents a row in the kb_accounts table.
 */
export interface AccountRow {
  account_id: string;
  description: string | null;
  plan: string; // 'free' | 'pro'
  created_at: number;
  updated_at: number;
}

/**
 * ApiKeyRow represents a row in the kb_api_keys table.
 */
export interface ApiKeyRow {
  key_hash: string;
  account_id: string;
  key_prefix: string;
  name: string | null;
  created_at: number;
  expires_at: number | null;
}

/**
 * UsageBucketRow is a row in the kb_usage table.
 */
export interface UsageBucketRow {
  bucket_start_ts: number;
  account_id: string;
  endpoint: string;
  request_count: number;
  token_in_count: number;
  token_out_count: number;
}

/**
 * LimitRow is a row in the kb_limits table.
 */
export interface LimitRow {
  plan: string;
  quota_requests_per_min: number;
  quota_storage_bytes: number;
  allow_reasoning: number; // 0 or 1
}
