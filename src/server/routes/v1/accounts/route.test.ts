import type { WorldMetadata } from "#/core/worlds/service.ts";
import { Store } from "oxigraph";
import { assert, assertEquals } from "@std/assert";
import { sqliteAppContext } from "#/server/app-context.ts";
import createApp from "./route.ts";
import type { Account } from "#/core/accounts/service.ts";

const appContext = await sqliteAppContext(":memory:");
const app = await createApp(appContext);

Deno.env.set("ADMIN_API_KEY", "admin-secret-token");
// ...
// ... around line 315
Deno.test("GET /v1/accounts/:account/worlds returns 400 if accountId invalid", async () => {
  // Only need app, no kv setup needed for this simple validation test
  const req = new Request(
    "http://localhost/v1/accounts/invalid-account-id/worlds",
    {
      headers: { "Authorization": "Bearer admin-secret-token" },
    },
  );
  const res = await app.fetch(req);
  await res.body?.cancel();
  assertEquals(res.status, 404);
});

const testAccount: Account = {
  id: "11111111-1111-4111-8111-111111111111",
  apiKey: "sk_test_account_1",
  description: "Test account",
  plan: "free",
  accessControl: {
    worlds: ["store-1", "store-2"],
  },
};

Deno.test("POST /v1/accounts creates a new account", async () => {
  const req = new Request("http://localhost/v1/accounts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${Deno.env.get("ADMIN_API_KEY")}`,
    },
    body: JSON.stringify(testAccount),
  });
  const res = await app.fetch(req);
  assertEquals(res.status, 201);

  const created = await res.json();
  assertEquals(created.id, "11111111-1111-4111-8111-111111111111");
  assertEquals(created.description, "Test account");
  assertEquals(created.plan, "free");
  assertEquals(created.apiKey.startsWith("sk_worlds_"), true);
});

Deno.test("GET /v1/accounts/:account retrieves an account", async () => {
  // First create an account
  await app.fetch(
    new Request("http://localhost/v1/accounts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("ADMIN_API_KEY")}`,
      },
      body: JSON.stringify({
        id: "22222222-2222-4222-8222-222222222222",
        description: "Test account 2",
        plan: "pro",
        accessControl: { worlds: [] },
      }),
    }),
  );

  // Then retrieve it
  const req = new Request(
    "http://localhost/v1/accounts/22222222-2222-4222-8222-222222222222",
    {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("ADMIN_API_KEY")}`,
      },
    },
  );
  const res = await app.fetch(req);
  assertEquals(res.status, 200);

  const account = await res.json();
  assertEquals(account.id, "22222222-2222-4222-8222-222222222222");
  assertEquals(account.plan, "pro");
});

Deno.test("PUT /v1/accounts/:account updates an account", async () => {
  // First create an account
  await app.fetch(
    new Request("http://localhost/v1/accounts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("ADMIN_API_KEY")}`,
      },
      body: JSON.stringify({
        id: "33333333-3333-4333-8333-333333333333",
        description: "Original description",
        plan: "free",
        accessControl: { worlds: ["store-1"] },
      }),
    }),
  );

  // Then update it
  const updatedAccount: Account = {
    id: "33333333-3333-4333-8333-333333333333",
    apiKey: "sk_test_account_3_updated",
    description: "Updated description",
    plan: "pro",
    accessControl: { worlds: ["store-1", "store-2", "store-3"] },
  };

  const req = new Request(
    "http://localhost/v1/accounts/33333333-3333-4333-8333-333333333333",
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("ADMIN_API_KEY")}`,
      },
      body: JSON.stringify(updatedAccount),
    },
  );
  const res = await app.fetch(req);
  assertEquals(res.status, 204);

  // Verify the update
  const getRes = await app.fetch(
    new Request(
      "http://localhost/v1/accounts/33333333-3333-4333-8333-333333333333",
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${Deno.env.get("ADMIN_API_KEY")}`,
        },
      },
    ),
  );
  const account = await getRes.json();
  assertEquals(account.description, "Updated description");
  assertEquals(account.plan, "pro");
});

Deno.test("GET /v1/accounts/:account/usage returns usage", async () => {
  // Setup: Inject usage data for testAccount (id: 1111...)
  // deno-lint-ignore no-explicit-any
  const event: any = {
    id: "usage-test-event",
    accountId: "11111111-1111-4111-8111-111111111111",
    timestamp: Date.now(),
    endpoint: "GET /worlds/{worldId}",
    params: { worldId: "store-1" },
    statusCode: 200,
  };
  await appContext.usageService.meter(event);

  const req = new Request(
    "http://localhost/v1/accounts/11111111-1111-4111-8111-111111111111/usage",
    {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("ADMIN_API_KEY")}`,
      },
    },
  );
  const res = await app.fetch(req);
  assertEquals(res.status, 200);
  const body = await res.json();
  assert(Array.isArray(body));
  const bucket = body.find((b: { endpoint: string; requestCount: number }) =>
    b.endpoint === "GET /worlds/store-1"
  );
  assert(bucket);
  assertEquals(bucket.requestCount, 1);
});

Deno.test("DELETE /v1/accounts/:account removes an account", async () => {
  // First create an account
  await app.fetch(
    new Request("http://localhost/v1/accounts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("ADMIN_API_KEY")}`,
      },
      body: JSON.stringify({
        id: "44444444-4444-4444-8444-444444444444",
        description: "To be deleted",
        plan: "free",
        accessControl: { worlds: [] },
      }),
    }),
  );

  // Then delete it
  const req = new Request(
    "http://localhost/v1/accounts/44444444-4444-4444-8444-444444444444",
    {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("ADMIN_API_KEY")}`,
      },
    },
  );
  const res = await app.fetch(req);
  assertEquals(res.status, 204);

  // Verify it's gone
  const getRes = await app.fetch(
    new Request(
      "http://localhost/v1/accounts/44444444-4444-4444-8444-444444444444",
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${Deno.env.get("ADMIN_API_KEY")}`,
        },
      },
    ),
  );
  assertEquals(getRes.status, 404);
});

Deno.test("POST /v1/accounts returns 401 without valid auth", async () => {
  const req = new Request("http://localhost/v1/accounts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer invalid-token",
    },
    body: JSON.stringify(testAccount),
  });
  const res = await app.fetch(req);
  assertEquals(res.status, 401);
});

Deno.test("GET /v1/accounts/:account returns 404 for non-existent account", async () => {
  const req = new Request("http://localhost/v1/accounts/non-existent", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${Deno.env.get("ADMIN_API_KEY")}`,
    },
  });
  const res = await app.fetch(req);
  assertEquals(res.status, 404);
});

Deno.test("PUT /v1/accounts/:account returns 400 for ID mismatch", async () => {
  const req = new Request("http://localhost/v1/accounts/account-a", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${Deno.env.get("ADMIN_API_KEY")}`,
    },
    body: JSON.stringify({
      id: "account-b",
      description: "Mismatched ID",
      plan: "free",
      accessControl: { worlds: [] },
    }),
  });
  const res = await app.fetch(req);
  assertEquals(res.status, 400);
});

Deno.test("POST /v1/accounts returns 409 if account already exists", async () => {
  // First create an account
  const accountId = "55555555-5555-5555-8555-555555555555";
  await app.fetch(
    new Request("http://localhost/v1/accounts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("ADMIN_API_KEY")}`,
      },
      body: JSON.stringify({
        id: accountId,
        description: "First account",
        plan: "free",
        accessControl: { worlds: [] },
      }),
    }),
  );

  // Try to create it again
  const req = new Request("http://localhost/v1/accounts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${Deno.env.get("ADMIN_API_KEY")}`,
    },
    body: JSON.stringify({
      id: accountId,
      description: "Duplicate account",
      plan: "free",
      accessControl: { worlds: [] },
    }),
  });
  const res = await app.fetch(req);
  assertEquals(res.status, 409);
});

const adminKey = "admin-secret-token";

Deno.test("GET /v1/accounts/:account/worlds", async (_t) => {
  const ctx = await sqliteAppContext(":memory:");
  const testApp = await createApp(ctx);
  Deno.env.set("ADMIN_API_KEY", adminKey);

  const { oxigraphService, accountsService } = ctx;

  // Create account with access to these stores
  const accountId = "66666666-6666-6666-8666-666666666666";

  // Create owner account first to satisfy foreign key constraint
  await accountsService.set({
    id: accountId,
    description: "Owner of stores",
    plan: "free",
    apiKey: "owner-api-key", // needed for creation
    accessControl: { worlds: [] },
  });

  await oxigraphService.setStore("store-A", accountId, new Store());
  await oxigraphService.setStore("store-B", accountId, new Store());

  const worlds = ["store-A", "store-B"];
  await testApp.fetch(
    new Request("http://localhost/v1/accounts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("ADMIN_API_KEY")}`,
      },
      body: JSON.stringify({
        id: accountId,
        description: "Account with worlds",
        plan: "free",
        accessControl: { worlds },
      }),
    }),
  );

  // Retrieve worlds
  const req = new Request(
    `http://localhost/v1/accounts/${accountId}/worlds`,
    {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("ADMIN_API_KEY")}`,
      },
    },
  );
  const res = await testApp.fetch(req);
  assertEquals(res.status, 200);

  const retrievedWorlds = await res.json();
  assertEquals(retrievedWorlds.length, 2);

  const storeA = retrievedWorlds.find((w: WorldMetadata) => w.id === "store-A");
  assertEquals(storeA?.createdBy, accountId);
  assertEquals(storeA?.tripleCount, 0);

  const storeB = retrievedWorlds.find((w: WorldMetadata) => w.id === "store-B");
  assertEquals(storeB?.createdBy, accountId);
  assertEquals(storeB?.tripleCount, 0);

  // kv.close(); // Not needed for SQLite / in-memory context auto-cleanup
});
