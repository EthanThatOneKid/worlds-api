/**
 * UsageBucket represents a usage monitoring bucket.
 */
export interface UsageBucket {
  bucketStartTs: number;
  accountId: string;
  endpoint: string;
  requestCount: number;
  tokenInCount: number;
  tokenOutCount: number;
}

/**
 * Limit represents an access control limit configuration.
 */
export interface Limit {
  plan: string;
  quotaRequestsPerMin: number;
  quotaStorageBytes: number;
  allowReasoning: boolean;
}
