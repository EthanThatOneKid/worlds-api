import type { SearchResult as _SearchResult } from "@fartlabs/search-store";

/**
 * WorldsOptions are the options for the Worlds API SDK.
 */
export interface WorldsOptions {
  baseUrl: string;
  apiKey: string;
}

/**
 * SearchResult represents a search result.
 */
export type SearchResult = _SearchResult<{
  subject: string;
  predicate: string;
  object: string;
}>;

/**
 * WorldRecord represents a world in the Worlds API.
 */
export interface WorldRecord {
  id: string;
  accountId: string;
  name: string;
  description: string | null;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
  isPublic: boolean;
}

/**
 * UsageBucketRecord represents usage statistics.
 */
export interface UsageBucketRecord {
  id: string;
  accountId: string;
  worldId: string;
  bucketStartTs: number;
  requestCount: number;
}
