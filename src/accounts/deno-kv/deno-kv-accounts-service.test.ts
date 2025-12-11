import { assert, assertEquals, assertExists } from "@std/assert";
import type {
  Account,
  AccountUsageEvent,
  AccountUsageSummary,
} from "#/accounts/accounts-service.ts";
import { DenoKvAccountsService } from "./deno-kv-accounts-service.ts";

Deno.test("DenoKvAccountsService.set and get - create and retrieve account", async () => {
  const kv = await Deno.openKv(":memory:");
  const service = new DenoKvAccountsService(kv);

  const account: Account = {
    id: "test-account-1",
    description: "Test account",
    plan: "free_plan",
    accessControl: {
      stores: ["store-1", "store-2"],
    },
  };

  await service.set(account);
  const retrieved = await service.get("test-account-1");

  assertExists(retrieved);
  assertEquals(retrieved.id, "test-account-1");
  assertEquals(retrieved.description, "Test account");
  assertEquals(retrieved.plan, "free_plan");
  assertEquals(retrieved.accessControl.stores, ["store-1", "store-2"]);

  kv.close();
});

Deno.test("DenoKvAccountsService.get - returns null for non-existent account", async () => {
  const kv = await Deno.openKv(":memory:");
  const service = new DenoKvAccountsService(kv);

  const result = await service.get("non-existent");
  assertEquals(result, null);

  kv.close();
});

Deno.test("DenoKvAccountsService.set - updates existing account", async () => {
  const kv = await Deno.openKv(":memory:");
  const service = new DenoKvAccountsService(kv);

  const account: Account = {
    id: "test-account-2",
    description: "Original description",
    plan: "free_plan",
    accessControl: {
      stores: ["store-1"],
    },
  };

  await service.set(account);

  const updatedAccount: Account = {
    ...account,
    description: "Updated description",
    accessControl: {
      stores: ["store-1", "store-2", "store-3"],
    },
  };

  await service.set(updatedAccount);
  const retrieved = await service.get("test-account-2");

  assertExists(retrieved);
  assertEquals(retrieved.description, "Updated description");
  assertEquals(retrieved.accessControl.stores.length, 3);

  kv.close();
});

Deno.test("DenoKvAccountsService.remove - deletes account", async () => {
  const kv = await Deno.openKv(":memory:");
  const service = new DenoKvAccountsService(kv);

  const account: Account = {
    id: "test-account-3",
    description: "To be deleted",
    plan: "free_plan",
    accessControl: {
      stores: [],
    },
  };

  await service.set(account);
  let retrieved = await service.get("test-account-3");
  assertExists(retrieved);

  await service.remove("test-account-3");
  retrieved = await service.get("test-account-3");
  assertEquals(retrieved, null);

  kv.close();
});

Deno.test("DenoKvAccountsService.meter - records usage event and updates summary for reads", async () => {
  const kv = await Deno.openKv(":memory:");
  const service = new DenoKvAccountsService(kv);

  const event: AccountUsageEvent = {
    id: "event-1",
    accountId: "account-1",
    timestamp: Date.now(),
    endpoint: "GET /stores/{storeId}",
    params: { storeId: "store-1" },
    statusCode: 200,
  };

  await service.meter(event);

  // Verify the event was stored
  const eventKey = ["accounts", "account-1", "events", "event-1"];
  const eventResult = await kv.get<AccountUsageEvent>(eventKey);
  assertExists(eventResult.value);
  assertEquals(eventResult.value.id, "event-1");

  // Verify the usage summary was updated
  const summaryKey = ["accounts", "account-1", "usage_summary"];
  const summaryResult = await kv.get<AccountUsageSummary>(summaryKey);
  assertExists(summaryResult.value);
  assertEquals(summaryResult.value.stores["store-1"].reads, 1);
  assertEquals(summaryResult.value.stores["store-1"].writes, 0);
  assertEquals(summaryResult.value.stores["store-1"].queries, 0);
  assertEquals(summaryResult.value.stores["store-1"].updates, 0);
  assertEquals(
    summaryResult.value.stores["store-1"].updatedAt,
    event.timestamp,
  );

  kv.close();
});

Deno.test("DenoKvAccountsService.meter - increments writes counter for POST", async () => {
  const kv = await Deno.openKv(":memory:");
  const service = new DenoKvAccountsService(kv);

  const event: AccountUsageEvent = {
    id: "event-2",
    accountId: "account-2",
    timestamp: Date.now(),
    endpoint: "POST /stores/{storeId}",
    params: { storeId: "store-2" },
    statusCode: 204,
  };

  await service.meter(event);

  const summaryKey = ["accounts", "account-2", "usage_summary"];
  const summaryResult = await kv.get<AccountUsageSummary>(summaryKey);
  assertExists(summaryResult.value);
  assertEquals(summaryResult.value.stores["store-2"].writes, 1);
  assertEquals(summaryResult.value.stores["store-2"].reads, 0);

  kv.close();
});

Deno.test("DenoKvAccountsService.meter - increments queries counter for SPARQL GET", async () => {
  const kv = await Deno.openKv(":memory:");
  const service = new DenoKvAccountsService(kv);

  const event: AccountUsageEvent = {
    id: "event-3",
    accountId: "account-3",
    timestamp: Date.now(),
    endpoint: "GET /stores/{storeId}/sparql",
    params: { storeId: "store-3" },
    statusCode: 200,
  };

  await service.meter(event);

  const summaryKey = ["accounts", "account-3", "usage_summary"];
  const summaryResult = await kv.get<AccountUsageSummary>(summaryKey);
  assertExists(summaryResult.value);
  assertEquals(summaryResult.value.stores["store-3"].queries, 1);
  assertEquals(summaryResult.value.stores["store-3"].updates, 0);

  kv.close();
});

Deno.test("DenoKvAccountsService.meter - increments updates counter for SPARQL POST", async () => {
  const kv = await Deno.openKv(":memory:");
  const service = new DenoKvAccountsService(kv);

  const event: AccountUsageEvent = {
    id: "event-4",
    accountId: "account-4",
    timestamp: Date.now(),
    endpoint: "POST /stores/{storeId}/sparql",
    params: { storeId: "store-4" },
    statusCode: 204,
  };

  await service.meter(event);

  const summaryKey = ["accounts", "account-4", "usage_summary"];
  const summaryResult = await kv.get<AccountUsageSummary>(summaryKey);
  assertExists(summaryResult.value);
  assertEquals(summaryResult.value.stores["store-4"].updates, 1);
  assertEquals(summaryResult.value.stores["store-4"].queries, 0);

  kv.close();
});

Deno.test("DenoKvAccountsService.meter - handles multiple events for same account", async () => {
  const kv = await Deno.openKv(":memory:");
  const service = new DenoKvAccountsService(kv);

  const baseTimestamp = Date.now();

  // Record multiple events
  await service.meter({
    id: "event-5a",
    accountId: "account-5",
    timestamp: baseTimestamp,
    endpoint: "GET /stores/{storeId}",
    params: { storeId: "store-5" },
    statusCode: 200,
  });

  await service.meter({
    id: "event-5b",
    accountId: "account-5",
    timestamp: baseTimestamp + 100,
    endpoint: "GET /stores/{storeId}",
    params: { storeId: "store-5" },
    statusCode: 200,
  });

  await service.meter({
    id: "event-5c",
    accountId: "account-5",
    timestamp: baseTimestamp + 200,
    endpoint: "POST /stores/{storeId}",
    params: { storeId: "store-5" },
    statusCode: 204,
  });

  const summaryKey = ["accounts", "account-5", "usage_summary"];
  const summaryResult = await kv.get<AccountUsageSummary>(summaryKey);
  assertExists(summaryResult.value);
  assertEquals(summaryResult.value.stores["store-5"].reads, 2);
  assertEquals(summaryResult.value.stores["store-5"].writes, 1);
  assertEquals(
    summaryResult.value.stores["store-5"].updatedAt,
    baseTimestamp + 200,
  );

  kv.close();
});

Deno.test("DenoKvAccountsService.meter - handles multiple stores for same account", async () => {
  const kv = await Deno.openKv(":memory:");
  const service = new DenoKvAccountsService(kv);

  const timestamp = Date.now();

  await service.meter({
    id: "event-6a",
    accountId: "account-6",
    timestamp,
    endpoint: "GET /stores/{storeId}",
    params: { storeId: "store-a" },
    statusCode: 200,
  });

  await service.meter({
    id: "event-6b",
    accountId: "account-6",
    timestamp: timestamp + 100,
    endpoint: "GET /stores/{storeId}",
    params: { storeId: "store-b" },
    statusCode: 200,
  });

  const summaryKey = ["accounts", "account-6", "usage_summary"];
  const summaryResult = await kv.get<AccountUsageSummary>(summaryKey);
  assertExists(summaryResult.value);
  assertEquals(summaryResult.value.stores["store-a"].reads, 1);
  assertEquals(summaryResult.value.stores["store-b"].reads, 1);
  assert(summaryResult.value.stores["store-a"]);
  assert(summaryResult.value.stores["store-b"]);

  kv.close();
});
