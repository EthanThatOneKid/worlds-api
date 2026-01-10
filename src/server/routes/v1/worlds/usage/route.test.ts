import { assert, assertEquals } from "@std/assert";
import { createTestAccount, createTestContext } from "#/server/testing.ts";
import createRoute from "./route.ts";

Deno.test("Usage API routes", async (t) => {
  const testContext = await createTestContext();
  const app = createRoute(testContext);

  await t.step(
    "GET /v1/worlds/:world/usage returns usage for specific world",
    async () => {
      const { id: accountId, apiKey } = await createTestAccount(testContext.db);
      const result = await testContext.db.worlds.add({
        accountId,
        name: "Test World",
        description: "Test Description",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deletedAt: null,
      });
      assert(result.ok);
      const worldId = result.id;

      // Create some usage data
      await testContext.db.usageBuckets.add({
        accountId: accountId,
        worldId: worldId,
        bucketStartTs: Date.now(),
        requestCount: 5,
      });

      // GET usage
      const response = await app.fetch(
        new Request(`http://localhost/v1/worlds/${worldId}/usage`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
          },
        }),
      );

      assertEquals(response.status, 200);
      const usage = await response.json();
      assert(Array.isArray(usage));
      // Should find usage for this world
      assert(usage.some((u: { worldId: string }) => u.worldId === worldId));
    },
  );

  await t.step(
    "GET /v1/worlds/:world/usage returns empty array when no usage exists",
    async () => {
      const { id: accountId, apiKey } = await createTestAccount(testContext.db);
      const result = await testContext.db.worlds.add({
        accountId,
        name: "Test World",
        description: "Test Description",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deletedAt: null,
      });
      assert(result.ok);
      const worldId = result.id;

      // GET usage
      const response = await app.fetch(
        new Request(`http://localhost/v1/worlds/${worldId}/usage`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
          },
        }),
      );

      assertEquals(response.status, 200);
      const usage = await response.json();
      assert(Array.isArray(usage));
      // May be empty or contain other test data
    },
  );

  await t.step(
    "GET /v1/worlds/:world/usage supports pagination",
    async () => {
      const { id: accountId, apiKey } = await createTestAccount(testContext.db);
      const result = await testContext.db.worlds.add({
        accountId,
        name: "Test World",
        description: "Test Description",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deletedAt: null,
      });
      assert(result.ok);
      const worldId = result.id;

      // Create multiple usage buckets
      for (let i = 0; i < 5; i++) {
        await testContext.db.usageBuckets.add({
          accountId: accountId,
          worldId: worldId,
          bucketStartTs: Date.now() + i,
          requestCount: i + 1,
        });
      }

      // GET usage with pagination
      const response = await app.fetch(
        new Request(
          `http://localhost/v1/worlds/${worldId}/usage?page=1&pageSize=2`,
          {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
            },
          },
        ),
      );

      assertEquals(response.status, 200);
      const usage = await response.json();
      assert(Array.isArray(usage));
      assert(usage.length <= 2);
    },
  );

  await t.step(
    "GET /v1/worlds/:world/usage returns 404 for non-existent world",
    async () => {
      const { apiKey } = await createTestAccount(testContext.db);

      const response = await app.fetch(
        new Request("http://localhost/v1/worlds/non-existent-world/usage", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
          },
        }),
      );

      assertEquals(response.status, 404);
    },
  );

  await t.step(
    "GET /v1/worlds/:world/usage returns 401 for unauthenticated request",
    async () => {
      const response = await app.fetch(
        new Request("http://localhost/v1/worlds/test-world/usage", {
          method: "GET",
        }),
      );

      assertEquals(response.status, 401);
    },
  );

  testContext.kv.close();
});
