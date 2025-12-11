import type {
  AccountUsageEvent,
  AccountUsageSummary,
  StoreUsageSummary,
} from "#/accounts/accounts-service.ts";

/**
 * updateUsageSummary updates the usage summary for an account.
 */
export function updateUsageSummary(
  usageSummary: AccountUsageSummary,
  event: AccountUsageEvent,
): void {
  // Initialize store usage if it doesn't exist.
  if (event.params.storeId) {
    usageSummary.stores[event.params.storeId] ??= emptyStoreUsageSummary(
      event.timestamp,
    );
    const storeUsageSummary = usageSummary.stores[event.params.storeId];

    // Update the store's last updated timestamp.
    storeUsageSummary.updatedAt = event.timestamp;
  }

  // Update the store's usage.
  switch (event.endpoint) {
    case "GET /stores/{storeId}": {
      usageSummary.stores[event.params.storeId].reads++;
      break;
    }

    case "POST /stores/{storeId}":
    case "PUT /stores/{storeId}":
    case "DELETE /stores/{storeId}": {
      usageSummary.stores[event.params.storeId].writes++;
      break;
    }

    case "GET /stores/{storeId}/sparql": {
      usageSummary.stores[event.params.storeId].queries++;
      break;
    }

    case "POST /stores/{storeId}/sparql": {
      usageSummary.stores[event.params.storeId].updates++;
      break;
    }
  }
}

/**
 * emptyStoreUsageSummary creates an empty store usage summary.
 */
export function emptyStoreUsageSummary(timestamp: number): StoreUsageSummary {
  return {
    reads: 0,
    writes: 0,
    queries: 0,
    updates: 0,
    updatedAt: timestamp,
  };
}
