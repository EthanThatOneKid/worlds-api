import { assertEquals } from "@std/assert";
import type {
  AccountUsageEvent,
  AccountUsageSummary,
} from "#/accounts/accounts-service.ts";
import { updateUsageSummary } from "./usage.ts";

Deno.test("updateUsageSummary - initializes new store usage", () => {
  const usageSummary: AccountUsageSummary = {
    stores: {},
  };

  const event: AccountUsageEvent = {
    id: "event-1",
    accountId: "account-1",
    timestamp: 1234567890,
    endpoint: "GET /stores/{storeId}",
    params: { storeId: "new-store" },
    statusCode: 200,
  };

  updateUsageSummary(usageSummary, event);

  assertEquals(usageSummary.stores["new-store"].reads, 1);
  assertEquals(usageSummary.stores["new-store"].writes, 0);
  assertEquals(usageSummary.stores["new-store"].queries, 0);
  assertEquals(usageSummary.stores["new-store"].updates, 0);
  assertEquals(usageSummary.stores["new-store"].updatedAt, 1234567890);
});

Deno.test("updateUsageSummary - increments reads counter for GET /stores/{storeId}", () => {
  const usageSummary: AccountUsageSummary = {
    stores: {
      "store-1": {
        reads: 5,
        writes: 0,
        queries: 0,
        updates: 0,
        updatedAt: 1000,
      },
    },
  };

  const event: AccountUsageEvent = {
    id: "event-2",
    accountId: "account-1",
    timestamp: 2000,
    endpoint: "GET /stores/{storeId}",
    params: { storeId: "store-1" },
    statusCode: 200,
  };

  updateUsageSummary(usageSummary, event);

  assertEquals(usageSummary.stores["store-1"].reads, 6);
  assertEquals(usageSummary.stores["store-1"].updatedAt, 2000);
});

Deno.test("updateUsageSummary - increments writes counter for POST /stores/{storeId}", () => {
  const usageSummary: AccountUsageSummary = {
    stores: {
      "store-2": {
        reads: 0,
        writes: 3,
        queries: 0,
        updates: 0,
        updatedAt: 1000,
      },
    },
  };

  const event: AccountUsageEvent = {
    id: "event-3",
    accountId: "account-1",
    timestamp: 3000,
    endpoint: "POST /stores/{storeId}",
    params: { storeId: "store-2" },
    statusCode: 204,
  };

  updateUsageSummary(usageSummary, event);

  assertEquals(usageSummary.stores["store-2"].writes, 4);
  assertEquals(usageSummary.stores["store-2"].updatedAt, 3000);
});

Deno.test("updateUsageSummary - increments writes counter for PUT /stores/{storeId}", () => {
  const usageSummary: AccountUsageSummary = {
    stores: {
      "store-3": {
        reads: 0,
        writes: 1,
        queries: 0,
        updates: 0,
        updatedAt: 1000,
      },
    },
  };

  const event: AccountUsageEvent = {
    id: "event-4",
    accountId: "account-1",
    timestamp: 4000,
    endpoint: "PUT /stores/{storeId}",
    params: { storeId: "store-3" },
    statusCode: 204,
  };

  updateUsageSummary(usageSummary, event);

  assertEquals(usageSummary.stores["store-3"].writes, 2);
  assertEquals(usageSummary.stores["store-3"].updatedAt, 4000);
});

Deno.test("updateUsageSummary - increments writes counter for DELETE /stores/{storeId}", () => {
  const usageSummary: AccountUsageSummary = {
    stores: {
      "store-4": {
        reads: 0,
        writes: 0,
        queries: 0,
        updates: 0,
        updatedAt: 1000,
      },
    },
  };

  const event: AccountUsageEvent = {
    id: "event-5",
    accountId: "account-1",
    timestamp: 5000,
    endpoint: "DELETE /stores/{storeId}",
    params: { storeId: "store-4" },
    statusCode: 204,
  };

  updateUsageSummary(usageSummary, event);

  assertEquals(usageSummary.stores["store-4"].writes, 1);
  assertEquals(usageSummary.stores["store-4"].updatedAt, 5000);
});

Deno.test("updateUsageSummary - increments queries counter for GET /stores/{storeId}/sparql", () => {
  const usageSummary: AccountUsageSummary = {
    stores: {
      "store-5": {
        reads: 0,
        writes: 0,
        queries: 10,
        updates: 0,
        updatedAt: 1000,
      },
    },
  };

  const event: AccountUsageEvent = {
    id: "event-6",
    accountId: "account-1",
    timestamp: 6000,
    endpoint: "GET /stores/{storeId}/sparql",
    params: { storeId: "store-5" },
    statusCode: 200,
  };

  updateUsageSummary(usageSummary, event);

  assertEquals(usageSummary.stores["store-5"].queries, 11);
  assertEquals(usageSummary.stores["store-5"].updatedAt, 6000);
});

Deno.test("updateUsageSummary - increments updates counter for POST /stores/{storeId}/sparql", () => {
  const usageSummary: AccountUsageSummary = {
    stores: {
      "store-6": {
        reads: 0,
        writes: 0,
        queries: 0,
        updates: 7,
        updatedAt: 1000,
      },
    },
  };

  const event: AccountUsageEvent = {
    id: "event-7",
    accountId: "account-1",
    timestamp: 7000,
    endpoint: "POST /stores/{storeId}/sparql",
    params: { storeId: "store-6" },
    statusCode: 204,
  };

  updateUsageSummary(usageSummary, event);

  assertEquals(usageSummary.stores["store-6"].updates, 8);
  assertEquals(usageSummary.stores["store-6"].updatedAt, 7000);
});

Deno.test("updateUsageSummary - updates timestamp on every call", () => {
  const usageSummary: AccountUsageSummary = {
    stores: {
      "store-7": {
        reads: 0,
        writes: 0,
        queries: 0,
        updates: 0,
        updatedAt: 1000,
      },
    },
  };

  const event1: AccountUsageEvent = {
    id: "event-8a",
    accountId: "account-1",
    timestamp: 2000,
    endpoint: "GET /stores/{storeId}",
    params: { storeId: "store-7" },
    statusCode: 200,
  };

  updateUsageSummary(usageSummary, event1);
  assertEquals(usageSummary.stores["store-7"].updatedAt, 2000);

  const event2: AccountUsageEvent = {
    id: "event-8b",
    accountId: "account-1",
    timestamp: 3000,
    endpoint: "POST /stores/{storeId}",
    params: { storeId: "store-7" },
    statusCode: 204,
  };

  updateUsageSummary(usageSummary, event2);
  assertEquals(usageSummary.stores["store-7"].updatedAt, 3000);
});

Deno.test("updateUsageSummary - handles multiple stores independently", () => {
  const usageSummary: AccountUsageSummary = {
    stores: {},
  };

  const event1: AccountUsageEvent = {
    id: "event-9a",
    accountId: "account-1",
    timestamp: 1000,
    endpoint: "GET /stores/{storeId}",
    params: { storeId: "store-a" },
    statusCode: 200,
  };

  const event2: AccountUsageEvent = {
    id: "event-9b",
    accountId: "account-1",
    timestamp: 2000,
    endpoint: "POST /stores/{storeId}",
    params: { storeId: "store-b" },
    statusCode: 204,
  };

  updateUsageSummary(usageSummary, event1);
  updateUsageSummary(usageSummary, event2);

  assertEquals(usageSummary.stores["store-a"].reads, 1);
  assertEquals(usageSummary.stores["store-a"].writes, 0);
  assertEquals(usageSummary.stores["store-b"].reads, 0);
  assertEquals(usageSummary.stores["store-b"].writes, 1);
});
