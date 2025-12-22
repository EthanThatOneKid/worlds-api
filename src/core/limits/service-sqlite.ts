import type { Client } from "#/core/database/database.ts";
import type { LimitsService } from "./service.ts";

import type { Limit } from "#/core/types/usage.ts";
import type { LimitRow } from "#/core/database/system.ts";

export class SqliteLimitsService implements LimitsService {
  constructor(private readonly db: Client) {}

  async getLimits(plan: string): Promise<Limit | null> {
    const result = await this.db.execute({
      sql: "SELECT * FROM kb_limits WHERE plan = ?",
      args: [plan],
    });
    const row = result.rows[0] as unknown as LimitRow | undefined;

    if (!row) return null;

    return {
      plan: row.plan,
      quotaRequestsPerMin: row.quota_requests_per_min,
      quotaStorageBytes: row.quota_storage_bytes,
      allowReasoning: Boolean(row.allow_reasoning),
    };
  }

  async setLimits(limit: Limit): Promise<void> {
    await this.db.execute({
      sql: `
        INSERT INTO kb_limits (plan, quota_requests_per_min, quota_storage_bytes, allow_reasoning)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(plan) DO UPDATE SET
            quota_requests_per_min = excluded.quota_requests_per_min,
            quota_storage_bytes = excluded.quota_storage_bytes,
            allow_reasoning = excluded.allow_reasoning
        `,
      args: [
        limit.plan,
        limit.quotaRequestsPerMin,
        limit.quotaStorageBytes,
        limit.allowReasoning ? 1 : 0,
      ],
    });
  }
}
