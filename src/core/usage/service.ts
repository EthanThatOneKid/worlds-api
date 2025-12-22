import type { UsageBucket } from "#/core/types/usage.ts";

/**
 * UsageService records and manages usage events.
 */
export interface UsageService {
  /**
   * meter records a usage event and updates the account's usage summary.
   */
  meter(event: AccountUsageEvent): Promise<void>;

  /**
   * getUsage retrieves the usage buckets for an account.
   */
  getUsage(accountId: string): Promise<UsageBucket[]>;
}

/**
 * AccountUsageEvent is a log entry for an event associated with an account.
 */
export interface AccountUsageEvent {
  /**
   * id is the unique ID of the event.
   */
  id: string;

  /**
   * accountId is the ID of the account associated with the event.
   */
  accountId: string;

  /**
   * timestamp is the Unix timestamp in milliseconds of the event.
   */
  timestamp: number;

  /**
   * endpoint is the method and pathname the event occurred on.
   */
  endpoint: AccountUsageEventEndpoint;

  /**
   * params is the parameters associated with the event.
   */
  params: Record<string, string>;

  /**
   * statusCode is the HTTP status code of the event.
   */
  statusCode: number;
}

/**
 * AccountUsageEventEndpoint is a valid HTTP method and pathname.
 */
export type AccountUsageEventEndpoint =
  | "GET /worlds/{worldId}"
  | "POST /worlds/{worldId}"
  | "PUT /worlds/{worldId}"
  | "PATCH /worlds/{worldId}"
  | "DELETE /worlds/{worldId}"
  | "GET /worlds/{worldId}/sparql"
  | "POST /worlds/{worldId}/sparql";
