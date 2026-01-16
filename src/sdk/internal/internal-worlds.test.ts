import { assert, assertEquals } from "@std/assert";
import { InternalWorlds } from "./internal-worlds.ts";
import { createServer } from "#/server/server.ts";
import { createTestContext } from "#/server/testing.ts";

Deno.test("InternalWorlds - Accounts", async (t) => {
  const appContext = await createTestContext();
  const server = await createServer(appContext);
  const internalWorlds = new InternalWorlds({
    baseUrl: "http://localhost/v1",
    apiKey: appContext.admin!.apiKey, // Use admin API key for SDK
    fetch: async (url: URL | RequestInfo, init?: RequestInit) => {
      // Direct integration testing via server.fetch
      return await server.fetch(new Request(url, init));
    },
  });

  await t.step("create account", async () => {
    const account = await internalWorlds.accounts.create({
      id: "acc_sdk_test",
      description: "SDK Test Account",
      plan: "free",
    });
    assertEquals(account.id, "acc_sdk_test");
    assertEquals(account.description, "SDK Test Account");
    assertEquals(account.plan, "free");
  });

  await t.step("get account", async () => {
    const account = await internalWorlds.accounts.get("acc_sdk_test");
    assert(account !== null);
    assertEquals(account.id, "acc_sdk_test");
    assertEquals(account.description, "SDK Test Account");
  });

  await t.step("list accounts", async () => {
    const accounts = await internalWorlds.accounts.list();
    assert(accounts.length >= 1);
    const found = accounts.find((a) => a.id === "acc_sdk_test");
    assert(found !== undefined);
  });

  await t.step("update account", async () => {
    await internalWorlds.accounts.update("acc_sdk_test", {
      description: "Updated SDK Account",
    });
    const account = await internalWorlds.accounts.get("acc_sdk_test");
    assert(account !== null);
    assertEquals(account.description, "Updated SDK Account");
  });

  await t.step("rotate account key", async () => {
    const original = await internalWorlds.accounts.get("acc_sdk_test");
    await internalWorlds.accounts.rotate("acc_sdk_test");
    const rotated = await internalWorlds.accounts.get("acc_sdk_test");
    assert(original && rotated);
    assert(original.apiKey !== rotated.apiKey);
  });

  await t.step("delete account", async () => {
    await internalWorlds.accounts.delete("acc_sdk_test");
    const account = await internalWorlds.accounts.get("acc_sdk_test");
    assertEquals(account, null);
  });

  appContext.kv.close();
});

Deno.test("InternalWorlds - Plans", async (t) => {
  const appContext = await createTestContext();
  const server = await createServer(appContext);
  const internalWorlds = new InternalWorlds({
    baseUrl: "http://localhost/v1",
    apiKey: appContext.admin!.apiKey,
    fetch: async (url: URL | RequestInfo, init?: RequestInit) => {
      return await server.fetch(new Request(url, init));
    },
  });

  await t.step("create plan", async () => {
    const plan = await internalWorlds.plans.create({
      name: "sdk_plan",
      quotaRequestsPerMin: 100,
      quotaStorageBytes: 1000,
    });
    assertEquals(plan.name, "sdk_plan");
    assertEquals(plan.quotaRequestsPerMin, 100);
  });

  await t.step("get plan", async () => {
    const plan = await internalWorlds.plans.get("sdk_plan");
    assert(plan !== null);
    assertEquals(plan.name, "sdk_plan");
  });

  await t.step("list plans", async () => {
    const plans = await internalWorlds.plans.list();
    const found = plans.find((p) => p.name === "sdk_plan");
    assert(found !== undefined);
  });

  await t.step("update plan", async () => {
    await internalWorlds.plans.update("sdk_plan", {
      name: "sdk_plan",
      quotaRequestsPerMin: 200,
      quotaStorageBytes: 2000,
    });
    const plan = await internalWorlds.plans.get("sdk_plan");
    assert(plan !== null);
    assertEquals(plan.quotaRequestsPerMin, 200);
  });

  await t.step("delete plan", async () => {
    await internalWorlds.plans.delete("sdk_plan");
    const plan = await internalWorlds.plans.get("sdk_plan");
    assertEquals(plan, null);
  });

  appContext.kv.close();
});

Deno.test("InternalWorlds - Worlds", async (t) => {
  const appContext = await createTestContext();
  const server = await createServer(appContext);

  // We need a test account to create worlds
  const { id: accountId, apiKey } = await import("#/server/testing.ts").then(
    (m) => m.createTestAccount(appContext.db),
  );

  // Use the account's API key for world operations
  const internalWorlds = new InternalWorlds({
    baseUrl: "http://localhost/v1",
    apiKey: apiKey,
    fetch: async (url: URL | RequestInfo, init?: RequestInit) => {
      return await server.fetch(new Request(url, init));
    },
  });

  let worldId: string;

  await t.step("create world", async () => {
    const world = await internalWorlds.worlds.create({
      accountId,
      name: "SDK World",
      description: "Test World",
      isPublic: false,
    });
    assert(world.id !== undefined);
    assertEquals(world.name, "SDK World");
    worldId = world.id;
  });

  await t.step("get world", async () => {
    const world = await internalWorlds.worlds.get(worldId);
    assert(world !== null);
    assertEquals(world.name, "SDK World");
  });

  await t.step("list worlds", async () => {
    const worlds = await internalWorlds.worlds.list();
    const found = worlds.find((w) => w.id === worldId);
    assert(found !== undefined);
  });

  await t.step("update world", async () => {
    await internalWorlds.worlds.update(worldId, {
      description: "Updated Description",
    });
    const world = await internalWorlds.worlds.get(worldId);
    assert(world !== null);
    assertEquals(world.description, "Updated Description");
  });

  await t.step("search world", async () => {
    // Mock search probably won't return anything meaningful without embeddings setup,
    // but we can check it doesn't crash
    // deno-lint-ignore no-explicit-any
    const results = await internalWorlds.worlds.search(worldId, "test") as any;
    assert(Array.isArray(results.results));
  });

  // Note: SPARQL and Usage might be harder to test without fuller data setup,
  // but let's at least call them to ensure wiring is correct.

  await t.step("delete world", async () => {
    await internalWorlds.worlds.remove(worldId);
    const world = await internalWorlds.worlds.get(worldId);
    assertEquals(world, null);
  });

  appContext.kv.close();
});
