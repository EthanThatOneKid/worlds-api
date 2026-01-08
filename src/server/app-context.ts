import type { OxigraphService } from "#/core/worlds/service.ts";
import type { AccountsService } from "#/core/accounts/service.ts";
import type { LimitsService } from "#/core/limits/service.ts";
import type { UsageService } from "#/core/usage/service.ts";
import { SqliteOxigraphService } from "#/core/worlds/service-sqlite.ts";
import { SqliteAccountsService } from "#/core/accounts/service-sqlite.ts";
import { SqliteLimitsService } from "#/core/limits/service-sqlite.ts";
import { SqliteUsageService } from "#/core/usage/service-sqlite.ts";
import { openDatabase } from "#/core/database/database.ts";
import { systemSchema } from "#/core/database/system.ts";

export interface AppContext {
  oxigraphService: OxigraphService;
  accountsService: AccountsService;
  limitsService: LimitsService;
  usageService: UsageService;
}

export async function sqliteAppContext(dbPath: string): Promise<AppContext> {
  const db = await openDatabase(dbPath);
  await db.executeMultiple(systemSchema);

  return {
    oxigraphService: new SqliteOxigraphService(
      db,
      (id: string) => {
        if (dbPath === ":memory:") {
          return openDatabase(":memory:");
        }

        return openDatabase(`file:world_${id}.db`);
      },
    ),
    accountsService: new SqliteAccountsService(db),
    limitsService: new SqliteLimitsService(db),
    usageService: new SqliteUsageService(db),
  };
}
