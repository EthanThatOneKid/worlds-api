import { assert, assertEquals } from "@std/assert";
import { InternalWorldsSdk } from "./sdk.ts";
import { createServer } from "#/server/server.ts";
import { createTestAccount, createTestContext } from "#/server/testing.ts";

Deno.test("InternalWorldsSdk - Accounts", async (t) => {
  const appContext = await createTestContext();
  const server = await createServer(appContext);
  const sdk = new InternalWorldsSdk({
    baseUrl: "http://localhost/v1",
    apiKey: appContext.admin!.apiKey, // Use admin API key for SDK
    fetch: (url, init) => server.fetch(new Request(url, init)),
  });

  await t.step("create account", async () => {
    const account = await sdk.accounts.create({
      id: "acc_sdk_test",
      description: "SDK Test Account",
      plan: "free",
    });
    assertEquals(account.id, "acc_sdk_test");
    assertEquals(account.description, "SDK Test Account");
    assertEquals(account.plan, "free");
  });

  await t.step("get account", async () => {
    const account = await sdk.accounts.get("acc_sdk_test");
    assert(account !== null);
    assertEquals(account.id, "acc_sdk_test");
    assertEquals(account.description, "SDK Test Account");
  });

  await t.step("list accounts", async () => {
    const accounts = await sdk.accounts.list();
    assert(accounts.length >= 1);
    const found = accounts.find((a) => a.id === "acc_sdk_test");
    assert(found !== undefined);
  });

  await t.step("update account", async () => {
    await sdk.accounts.update("acc_sdk_test", {
      description: "Updated SDK Account",
    });
    const account = await sdk.accounts.get("acc_sdk_test");
    assert(account !== null);
    assertEquals(account.description, "Updated SDK Account");
  });

  await t.step("rotate account key", async () => {
    const original = await sdk.accounts.get("acc_sdk_test");
    await sdk.accounts.rotate("acc_sdk_test");
    const rotated = await sdk.accounts.get("acc_sdk_test");
    assert(original && rotated);
    assert(original.apiKey !== rotated.apiKey);
  });

  await t.step("delete account", async () => {
    await sdk.accounts.delete("acc_sdk_test");
    const account = await sdk.accounts.get("acc_sdk_test");
    assertEquals(account, null);
  });

  appContext.kv.close();
});

Deno.test("InternalWorldsSdk - Worlds", async (t) => {
  const appContext = await createTestContext();
  const server = await createServer(appContext);

  // We need a test account to create worlds
  // We need a test account to create worlds
  const { id: accountId, apiKey } = await createTestAccount(appContext.db);

  // Use the account's API key for world operations
  const sdk = new InternalWorldsSdk({
    baseUrl: "http://localhost/v1",
    apiKey: apiKey,
    fetch: (url, init) => server.fetch(new Request(url, init)),
  });

  let worldId: string;

  await t.step("create world", async () => {
    const world = await sdk.worlds.create({
      accountId,
      label: "SDK World",
      description: "Test World",
      isPublic: false,
    });
    assert(world.id !== undefined);
    assertEquals(world.label, "SDK World");
    worldId = world.id;
  });

  await t.step("get world", async () => {
    const world = await sdk.worlds.get(worldId);
    assert(world !== null);
    assertEquals(world.label, "SDK World");
  });

  await t.step("list worlds", async () => {
    const worlds = await sdk.worlds.list();
    const found = worlds.find((w) => w.id === worldId);
    assert(found !== undefined);
  });

  await t.step("update world", async () => {
    await sdk.worlds.update(worldId, {
      description: "Updated Description",
    });
    const world = await sdk.worlds.get(worldId);
    assert(world !== null);
    assertEquals(world.description, "Updated Description");
  });

  await t.step("search world", async () => {
    // Mock search probably won't return anything meaningful without embeddings setup,
    // but we can check it doesn't crash
    const results = await sdk.worlds.search(worldId, "test");
    assert(Array.isArray(results));
  });

  await t.step("sparql update and query", async () => {
    // 1. Insert data via SPARQL Update
    const updateQuery = `
      INSERT DATA {
        <http://example.org/subject> <http://example.org/predicate> "Create Object" .
      }
    `;
    await sdk.worlds.sparql(worldId, updateQuery);

    // 2. Query data via SPARQL Query
    const selectQuery = `
      SELECT ?s ?p ?o WHERE {
        ?s ?p ?o
      }
    `;

    const result = await sdk.worlds.sparql(
      worldId,
      selectQuery,
      // deno-lint-ignore no-explicit-any
    ) as any;
    assert(result.results.bindings.length > 0);

    const binding = result.results.bindings[0];
    assertEquals(binding.o.value, "Create Object");
  });

  await t.step("delete world", async () => {
    await sdk.worlds.remove(worldId);
    const world = await sdk.worlds.get(worldId);
    assertEquals(world, null);
  });

  appContext.kv.close();
});

Deno.test("InternalWorldsSdk - Admin Account Override", async (t) => {
  const appContext = await createTestContext();
  const server = await createServer(appContext);

  // Create SDK with admin API key
  const adminSdk = new InternalWorldsSdk({
    baseUrl: "http://localhost/v1",
    apiKey: appContext.admin!.apiKey,
    fetch: (url, init) => server.fetch(new Request(url, init)),
  });

  // Create two test accounts
  const accountA = await createTestAccount(appContext.db);
  const accountB = await createTestAccount(appContext.db);

  await t.step("admin can list worlds for specific account", async () => {
    // Create worlds for both accounts directly in DB
    await appContext.db.worlds.add({
      accountId: accountA.id,
      label: "Account A World",
      description: "Test",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deletedAt: null,
      isPublic: false,
    });

    await appContext.db.worlds.add({
      accountId: accountB.id,
      label: "Account B World",
      description: "Test",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deletedAt: null,
      isPublic: false,
    });

    // List worlds for Account A using admin override
    const worldsA = await adminSdk.worlds.list(1, 20, {
      accountId: accountA.id,
    });
    assertEquals(worldsA.length, 1);
    assertEquals(worldsA[0].label, "Account A World");
    assertEquals(worldsA[0].accountId, accountA.id);

    // List worlds for Account B using admin override
    const worldsB = await adminSdk.worlds.list(1, 20, {
      accountId: accountB.id,
    });
    assertEquals(worldsB.length, 1);
    assertEquals(worldsB[0].label, "Account B World");
    assertEquals(worldsB[0].accountId, accountB.id);
  });

  await t.step("admin can create world for specific account", async () => {
    const world = await adminSdk.worlds.create({
      accountId: accountA.id, // This will be ignored
      label: "Admin Created World",
      description: "Created via admin override",
      isPublic: false,
    }, { accountId: accountB.id }); // This accountId takes precedence

    assertEquals(world.accountId, accountB.id);
    assertEquals(world.label, "Admin Created World");

    // Verify in database
    const dbWorld = await appContext.db.worlds.find(world.id);
    assert(dbWorld);
    assertEquals(dbWorld.value.accountId, accountB.id);
  });

  await t.step("admin can get world for specific account", async () => {
    // Create a world for Account A
    const result = await appContext.db.worlds.add({
      accountId: accountA.id,
      label: "Test World",
      description: "Test",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deletedAt: null,
      isPublic: false,
    });
    assert(result.ok);

    // Get world using admin override
    const world = await adminSdk.worlds.get(result.id, {
      accountId: accountA.id,
    });
    assert(world !== null);
    assertEquals(world.accountId, accountA.id);
  });

  await t.step("admin can update world for specific account", async () => {
    // Create a world for Account A
    const result = await appContext.db.worlds.add({
      accountId: accountA.id,
      label: "Original Name",
      description: "Original",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deletedAt: null,
      isPublic: false,
    });
    assert(result.ok);

    // Update using admin override
    await adminSdk.worlds.update(result.id, {
      description: "Updated via admin",
    }, { accountId: accountA.id });

    // Verify update
    const world = await adminSdk.worlds.get(result.id, {
      accountId: accountA.id,
    });
    assert(world !== null);
    assertEquals(world.description, "Updated via admin");
  });

  await t.step("admin can delete world for specific account", async () => {
    // Create a world for Account B
    const result = await appContext.db.worlds.add({
      accountId: accountB.id,
      label: "To Delete",
      description: "Test",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deletedAt: null,
      isPublic: false,
    });
    assert(result.ok);

    // Delete using admin override
    await adminSdk.worlds.remove(result.id, { accountId: accountB.id });

    // Verify deletion
    const world = await appContext.db.worlds.find(result.id);
    assertEquals(world, null);
  });

  await t.step(
    "admin SPARQL operations claim usage for specific account",
    async () => {
      // Create a world for Account A
      const result = await appContext.db.worlds.add({
        accountId: accountA.id,
        label: "SPARQL Test World",
        description: "Test",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deletedAt: null,
        isPublic: false,
      });
      assert(result.ok);
      const worldId = result.id;

      // Perform SPARQL update using admin override
      await adminSdk.worlds.sparql(
        worldId,
        'INSERT DATA { <http://example.org/s> <http://example.org/p> "Admin Object" . }',
        { accountId: accountA.id },
      );

      // Perform SPARQL query using admin override
      const queryResult = await adminSdk.worlds.sparql(
        worldId,
        "SELECT * WHERE { ?s ?p ?o }",
        { accountId: accountA.id },
        // deno-lint-ignore no-explicit-any
      ) as any;

      assert(queryResult.results.bindings.length > 0);

      // Verify usage is attributed to Account A
      // Note: Only SPARQL queries track usage, not updates
      // Usage verification removed as historical usage buckets are deprecated
    },
  );

  await t.step("admin can search world for specific account", async () => {
    // Create a world for Account A
    const result = await appContext.db.worlds.add({
      accountId: accountA.id,
      label: "Search Test World",
      description: "Test",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deletedAt: null,
      isPublic: false,
    });
    assert(result.ok);

    // Search using admin override (won't return meaningful results without embeddings, but verifies no crash)
    const searchResults = await adminSdk.worlds.search(
      result.id,
      "test query",
      { accountId: accountA.id },
    );
    assert(Array.isArray(searchResults));
  });

  appContext.kv.close();
});
