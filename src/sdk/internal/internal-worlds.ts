import type { WorldsOptions } from "#/sdk/types.ts";
import { Worlds } from "#/sdk/worlds.ts";
import { Accounts } from "./accounts.ts";
import { Plans } from "./plans.ts";

/**
 * InternalWorlds is a TypeScript SDK for internal-only operations
 * on the Worlds API.
 */
export class InternalWorlds {
  public readonly accounts: Accounts;
  public readonly plans: Plans;
  public readonly worlds: Worlds;

  public constructor(options: WorldsOptions) {
    // Initialize internal SDK modules.
    this.accounts = new Accounts(options);
    this.plans = new Plans(options);

    // Initialize public SDK modules.
    this.worlds = new Worlds(options);
  }
}
