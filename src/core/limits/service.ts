import type { Limit } from "#/core/types/usage.ts";

/**
 * LimitsService manages plan limits.
 */
export interface LimitsService {
  /**
   * getLimits gets the limits for a plan.
   */
  getLimits(plan: string): Promise<Limit | null>;

  /**
   * setLimits sets the limits for a plan.
   */
  setLimits(limit: Limit): Promise<void>;
}
