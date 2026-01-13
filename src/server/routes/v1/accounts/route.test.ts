import { assert, assertEquals } from "@std/assert";
import { createTestContext } from "#/server/testing.ts";
import createApp from "./route.ts";

Deno.test("Accounts API routes", async (t) => {
  const testContext = await createTestContext();
  const app = createApp(testContext);

  await t.step(
    "GET /v1/accounts returns paginated list of accounts",
    async () => {
      const account1 = await testContext.db.accounts.add({
        description: "Test account 1",
        planType: "free",
        apiKey: crypto.randomUUID(),
        metadata: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deletedAt: null,
      });

      const account2 = await testContext.db.accounts.add({
        description: "Test account 2",
        planType: "pro",
        apiKey: crypto.randomUUID(),
        metadata: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deletedAt: null,
      });

      if (!account1.ok || !account2.ok) {
        throw new Error("Failed to create test accounts");
      }

      const req = new Request(
        "http://localhost/v1/accounts?page=1&pageSize=20",
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${testContext.admin!.apiKey}`,
          },
        },
      );
      const res = await app.fetch(req);
      assertEquals(res.status, 200);

      const accounts = await res.json();
      assert(Array.isArray(accounts));
      assert(accounts.length >= 2);
    },
  );

  testContext.kv.close();
});

Deno.test("Accounts API routes - CRUD operations", async (t) => {
  const testContext = await createTestContext();
  const app = createApp(testContext);

  await t.step("POST /v1/accounts creates a new account", async () => {
    const req = new Request("http://localhost/v1/accounts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${testContext.admin!.apiKey}`,
      },
      body: JSON.stringify({
        description: "Test account",
        planType: "free",
      }),
    });
    const res = await app.fetch(req);
    assertEquals(res.status, 201);

    const body = await res.json();
    assertEquals(body, null);
  });

  await t.step("GET /v1/accounts/:account retrieves an account", async () => {
    // Create an account directly using db
    const result = await testContext.db.accounts.add({
      description: "Test account 2",
      planType: "pro",
      apiKey: crypto.randomUUID(),
      metadata: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deletedAt: null,
    });

    if (!result.ok) {
      throw new Error("Failed to create test account");
    }

    const accountId = result.id;

    // Then retrieve it
    const req = new Request(
      `http://localhost/v1/accounts/${accountId}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${testContext.admin!.apiKey}`,
        },
      },
    );
    const res = await app.fetch(req);
    assertEquals(res.status, 200);

    const account = await res.json();
    assertEquals(account.description, "Test account 2");
    assertEquals(account.planType, "pro");
    assertEquals(typeof account.apiKey, "string");
    assertEquals(typeof account.createdAt, "number");
    assertEquals(typeof account.updatedAt, "number");
  });

  await t.step("PUT /v1/accounts/:account updates an account", async () => {
    // First create an account
    const createResult = await testContext.db.accounts.add({
      description: "Original description",
      planType: "free",
      apiKey: crypto.randomUUID(),
      metadata: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deletedAt: null,
    });

    if (!createResult.ok) {
      throw new Error("Failed to create test account");
    }

    const accountId = createResult.id;

    // Then update it
    const req = new Request(
      `http://localhost/v1/accounts/${accountId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${testContext.admin!.apiKey}`,
        },
        body: JSON.stringify({
          description: "Updated description",
          planType: "pro",
        }),
      },
    );
    const res = await app.fetch(req);
    assertEquals(res.status, 204);

    // Verify the update
    const getRes = await app.fetch(
      new Request(
        `http://localhost/v1/accounts/${accountId}`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${testContext.admin!.apiKey}`,
          },
        },
      ),
    );
    const account = await getRes.json();
    assertEquals(account.description, "Updated description");
    assertEquals(account.planType, "pro");
  });

  await t.step("DELETE /v1/accounts/:account removes an account", async () => {
    // First create an account
    const createResult = await testContext.db.accounts.add({
      description: "To be deleted",
      planType: "free",
      apiKey: crypto.randomUUID(),
      metadata: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deletedAt: null,
    });

    if (!createResult.ok) {
      throw new Error("Failed to create test account");
    }

    const accountId = createResult.id;

    // Then delete it
    const req = new Request(
      `http://localhost/v1/accounts/${accountId}`,
      {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${testContext.admin!.apiKey}`,
        },
      },
    );
    const res = await app.fetch(req);
    assertEquals(res.status, 204);

    // Verify it's gone
    const getRes = await app.fetch(
      new Request(
        `http://localhost/v1/accounts/${accountId}`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${testContext.admin!.apiKey}`,
          },
        },
      ),
    );
    assertEquals(getRes.status, 404);
  });

  await t.step(
    "POST /v1/accounts/:account/rotate rotates account API key",
    async () => {
      // First create an account
      const createResult = await testContext.db.accounts.add({
        description: "Account to rotate",
        planType: "free",
        apiKey: crypto.randomUUID(),
        metadata: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deletedAt: null,
      });

      if (!createResult.ok) {
        throw new Error("Failed to create test account");
      }

      const accountId = createResult.id;

      // Get the original API key
      const originalAccount = await testContext.db.accounts.find(accountId);
      if (!originalAccount) {
        throw new Error("Failed to find created account");
      }
      const originalApiKey = originalAccount.value.apiKey;

      // Rotate the key
      const req = new Request(
        `http://localhost/v1/accounts/${accountId}/rotate`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${testContext.admin!.apiKey}`,
          },
        },
      );
      const res = await app.fetch(req);
      assertEquals(res.status, 204);

      // Verify the key was rotated
      const getRes = await app.fetch(
        new Request(
          `http://localhost/v1/accounts/${accountId}`,
          {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${testContext.admin!.apiKey}`,
            },
          },
        ),
      );
      assertEquals(getRes.status, 200);
      const account = await getRes.json();
      assert(
        account.apiKey !== originalApiKey,
        "API key should be different after rotation",
      );
    },
  );

  await t.step("POST /v1/accounts handles metadata", async () => {
    // Create account with metadata
    const req = new Request("http://localhost/v1/accounts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${testContext.admin!.apiKey}`,
      },
      body: JSON.stringify({
        description: "Metadata account",
        planType: "free",
        metadata: {
          key: "value",
          nested: "prop-123",
        },
      }),
    });
    const res = await app.fetch(req);
    assertEquals(res.status, 201);

    // Find the account to verify
    const { result } = await testContext.db.accounts.getMany();
    const account = result.find((r) =>
      r.value.description === "Metadata account"
    );
    assert(account, "Account should verify");
    assertEquals(account.value.metadata, {
      key: "value",
      nested: "prop-123",
    });

    // Update metadata
    const updateReq = new Request(
      `http://localhost/v1/accounts/${account.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${testContext.admin!.apiKey}`,
        },
        body: JSON.stringify({
          description: "Updated metadata account",
          planType: "free",
          metadata: {
            newKey: "newValue",
          },
        }),
      },
    );
    const updateRes = await app.fetch(updateReq);
    assertEquals(updateRes.status, 204);

    // Verify update
    const finalAccount = await testContext.db.accounts.find(account.id);
    assertEquals(finalAccount?.value.metadata, {
      key: "value",
      nested: "prop-123",
      newKey: "newValue",
    });
  });

  testContext.kv.close();
});

Deno.test("Accounts API routes - Error handling", async (t) => {
  const testContext = await createTestContext();
  const app = createApp(testContext);

  await t.step("POST /v1/accounts returns 401 without valid auth", async () => {
    const req = new Request("http://localhost/v1/accounts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer invalid-token",
      },
      body: JSON.stringify({
        description: "Test account",
        planType: "free",
      }),
    });
    const res = await app.fetch(req);
    assertEquals(res.status, 401);
  });

  await t.step(
    "POST /v1/accounts returns 403 without admin access",
    async () => {
      // Create a non-admin account
      const createResult = await testContext.db.accounts.add({
        description: "Non-admin account",
        planType: "free",
        apiKey: "test-api-key-123",
        metadata: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deletedAt: null,
      });

      if (!createResult.ok) {
        throw new Error("Failed to create test account");
      }

      const req = new Request("http://localhost/v1/accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer test-api-key-123",
        },
        body: JSON.stringify({
          description: "Test account",
          planType: "free",
        }),
      });
      const res = await app.fetch(req);
      assertEquals(res.status, 403);
    },
  );

  await t.step(
    "GET /v1/accounts/:account returns 404 for non-existent account",
    async () => {
      const req = new Request("http://localhost/v1/accounts/non-existent-id", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${testContext.admin!.apiKey}`,
        },
      });
      const res = await app.fetch(req);
      assertEquals(res.status, 404);
    },
  );

  testContext.kv.close();
});

Deno.test("Accounts API routes - Edge cases", async (t) => {
  const testContext = await createTestContext();
  const app = createApp(testContext);

  await t.step(
    "POST /v1/accounts can create multiple accounts with same description",
    async () => {
      // Since the route auto-generates IDs, we can create multiple accounts
      // with the same description without conflicts
      const req1 = new Request("http://localhost/v1/accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${testContext.admin!.apiKey}`,
        },
        body: JSON.stringify({
          description: "Duplicate description test",
          planType: "free",
        }),
      });
      const res1 = await app.fetch(req1);
      assertEquals(res1.status, 201);

      const req2 = new Request("http://localhost/v1/accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${testContext.admin!.apiKey}`,
        },
        body: JSON.stringify({
          description: "Duplicate description test",
          planType: "free",
        }),
      });
      const res2 = await app.fetch(req2);
      assertEquals(res2.status, 201);
    },
  );

  testContext.kv.close();
});
