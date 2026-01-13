import { AccountsAPI } from "./accounts.ts";
import { PlansAPI } from "./plans.ts";
import type { WorldsOptions } from "./worlds.ts";
import { WorldsAPI } from "./worlds.ts";

/**
 * InternalWorldsAPI is a TypeScript SDK for internal-only operations
 * on the Worlds API.
 */
export class InternalWorldsAPI {
  public readonly accounts: AccountsAPI;
  public readonly plans: PlansAPI;
  public readonly worlds: WorldsAPI;

  public constructor(options: WorldsOptions) {
    // Initialize internal SDK modules.
    this.accounts = new AccountsAPI(options);
    this.plans = new PlansAPI(options);

    // Initialize public SDK modules.
    this.worlds = new WorldsAPI(options);
  }
}
