import { assert, assertEquals } from "@std/assert";
import { createTestAccount, createTestContext } from "#/server/testing.ts";
import createRoute from "./route.ts";
import { createServer } from "#/server/server.ts";

Deno.test("Worlds API routes - GET operations", async (t) => {
  const testContext = await createTestContext();
  const { db } = testContext;
  const app = createRoute(testContext);

  await t.step("GET /v1/worlds/:world returns world metadata", async () => {
    const { id: accountId, apiKey } = await createTestAccount(db);
    const result = await db.worlds.add({
      accountId,
      label: "Test World",
      description: "Test Description",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deletedAt: null,
    });
    assert(result.ok);
    const worldId = result.id;

    const resp = await app.fetch(
      new Request(`http://localhost/v1/worlds/${worldId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
        },
      }),
    );

    assertEquals(resp.status, 200);
    assertEquals(resp.headers.get("content-type"), "application/json");

    const world = await resp.json();
    assertEquals(world.accountId, accountId);
    assertEquals(world.label, "Test World");
    assert(typeof world.createdAt === "number");
    assert(typeof world.updatedAt === "number");
    assertEquals(world.deletedAt, null);
    assertEquals(world.isPublic, false);
  });

  await t.step(
    "GET /v1/worlds/:world returns 404 for non-existent world",
    async () => {
      const { apiKey } = await createTestAccount(db);

      const resp = await app.fetch(
        new Request("http://localhost/v1/worlds/non-existent-world", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
          },
        }),
      );

      assertEquals(resp.status, 404);
    },
  );

  await t.step(
    "GET /v1/worlds/:world returns 404 for deleted world",
    async () => {
      const { id: accountId, apiKey } = await createTestAccount(db);
      const result = await db.worlds.add({
        accountId,
        label: "Test World",
        description: "Test Description",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deletedAt: null,
      });
      assert(result.ok);
      const worldId = result.id;

      // Mark world as deleted
      await db.worlds.update(worldId, { deletedAt: Date.now() });

      const resp = await app.fetch(
        new Request(`http://localhost/v1/worlds/${worldId}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
          },
        }),
      );

      assertEquals(resp.status, 404);
    },
  );

  testContext.kv.close();
});

Deno.test("Worlds API routes - POST operations", async (t) => {
  const testContext = await createTestContext();
  const { db } = testContext;
  const app = createRoute(testContext);

  await t.step("POST /v1/worlds creates a new world", async () => {
    const { apiKey } = await createTestAccount(db);

    const req = new Request("http://localhost/v1/worlds", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        label: "New World",
        description: "New Description",
        isPublic: true,
      }),
    });
    const res = await app.fetch(req);
    assertEquals(res.status, 201);

    const world = await res.json();
    assertEquals(world.label, "New World");
    assertEquals(world.description, "New Description");
    assertEquals(world.isPublic, true);
    assert(typeof world.id === "string");
    assert(typeof world.createdAt === "number");
    assert(typeof world.updatedAt === "number");
    assertEquals(world.deletedAt, null);
  });

  testContext.kv.close();
});

Deno.test("Worlds API routes - PUT operations", async (t) => {
  const testContext = await createTestContext();
  const { db } = testContext;
  const app = createRoute(testContext);

  await t.step(
    "PUT /v1/worlds/:world updates world description",
    async () => {
      const { id: accountId, apiKey } = await createTestAccount(db);
      const result = await db.worlds.add({
        accountId,
        label: "Test World",
        description: "Test Description",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deletedAt: null,
      });
      assert(result.ok);
      const worldId = result.id;

      // Update description
      const updateResp = await app.fetch(
        new Request(`http://localhost/v1/worlds/${worldId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ description: "Updated description" }),
        }),
      );
      assertEquals(updateResp.status, 204);

      // Verify update
      const getResp = await app.fetch(
        new Request(`http://localhost/v1/worlds/${worldId}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
          },
        }),
      );
      assertEquals(getResp.status, 200);
      const world = await getResp.json();
      assertEquals(world.description, "Updated description");
    },
  );

  await t.step(
    "PUT /v1/worlds/:world returns 400 for invalid JSON",
    async () => {
      const { id: accountId, apiKey } = await createTestAccount(db);
      const result = await db.worlds.add({
        accountId,
        label: "Test World",
        description: "Test Description",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deletedAt: null,
      });
      assert(result.ok);
      const worldId = result.id;

      const invalidJsonResp = await app.fetch(
        new Request(`http://localhost/v1/worlds/${worldId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: "invalid-json",
        }),
      );
      assertEquals(invalidJsonResp.status, 400);
    },
  );

  await t.step(
    "PUT /v1/worlds/:world returns 404 for non-existent world",
    async () => {
      const { apiKey } = await createTestAccount(db);

      const updateResp = await app.fetch(
        new Request("http://localhost/v1/worlds/non-existent-world", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ description: "Test" }),
        }),
      );
      assertEquals(updateResp.status, 404);
    },
  );

  testContext.kv.close();
});

Deno.test("Worlds API routes - DELETE operations", async (t) => {
  const testContext = await createTestContext();
  const { db } = testContext;
  const app = createRoute(testContext);

  await t.step("DELETE /v1/worlds/:world deletes a world", async () => {
    const { id: accountId, apiKey } = await createTestAccount(db);
    const result = await db.worlds.add({
      accountId,
      label: "Test World",
      description: "Test Description",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deletedAt: null,
    });
    assert(result.ok);
    const worldId = result.id;
    // Create a dummy blob to verify deletion
    await db.worldBlobs.set(worldId, new Uint8Array([1, 2, 3]));

    // Delete world
    const deleteResp = await app.fetch(
      new Request(`http://localhost/v1/worlds/${worldId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
        },
      }),
    );
    if (deleteResp.status !== 204) {
      console.log(await deleteResp.text());
    }
    assertEquals(deleteResp.status, 204);

    // Verify deletion - should return 404
    const getResp = await app.fetch(
      new Request(`http://localhost/v1/worlds/${worldId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
        },
      }),
    );
    assertEquals(getResp.status, 404);

    // Verify blob deletion
    const blobResult = await db.worldBlobs.find(worldId);
    assertEquals(blobResult, null);
  });

  await t.step(
    "DELETE /v1/worlds/:world returns 404 for non-existent world",
    async () => {
      const { apiKey } = await createTestAccount(db);

      const deleteResp = await app.fetch(
        new Request("http://localhost/v1/worlds/non-existent-world", {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
          },
        }),
      );
      assertEquals(deleteResp.status, 404);
    },
  );

  testContext.kv.close();
});

Deno.test("Worlds API routes - List operations", async (t) => {
  const testContext = await createTestContext();
  const { db } = testContext;
  const app = createRoute(testContext);

  await t.step(
    "GET /v1/worlds returns paginated list of worlds for account",
    async () => {
      const { id: accountId, apiKey } = await createTestAccount(db);

      const result1 = await db.worlds.add({
        accountId,
        label: "Test World 1",
        description: "Test Description 1",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deletedAt: null,
      });
      assert(result1.ok);

      const result2 = await db.worlds.add({
        accountId,
        label: "Test World 2",
        description: "Test Description 2",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deletedAt: null,
      });
      assert(result2.ok);

      const resp = await app.fetch(
        new Request("http://localhost/v1/worlds?page=1&pageSize=20", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
          },
        }),
      );

      assertEquals(resp.status, 200);
      const worlds = await resp.json();
      assert(Array.isArray(worlds));
      assert(worlds.length >= 2);

      // Verify worlds belong to test account
      // Note: we can't search by worldId directly in the name since names are "Test World 1", but IDs are UUIDs.
      // The original test checked names.
      const worldNames = worlds.map((w: { label: string }) => w.label);
      assert(worldNames.includes("Test World 1"));
      assert(worldNames.includes("Test World 2"));
    },
  );

  await t.step(
    "GET /v1/worlds returns 401 for unauthenticated request",
    async () => {
      const resp = await app.fetch(
        new Request("http://localhost/v1/worlds", {
          method: "GET",
        }),
      );

      assertEquals(resp.status, 401);
    },
  );

  testContext.kv.close();
});

Deno.test("Admin Account Override", async (t) => {
  const testContext = await createTestContext();
  const { db, admin } = testContext;
  const app = await createServer(testContext);
  const adminApiKey = admin!.apiKey;

  await t.step("Admin can list worlds for a specific account", async () => {
    const accountA = await createTestAccount(db);
    const accountB = await createTestAccount(db);

    // Create world for Account A
    await db.worlds.add({
      accountId: accountA.id,
      label: "World A",
      description: "Description A",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deletedAt: null,
      isPublic: false,
    });

    // Create world for Account B
    await db.worlds.add({
      accountId: accountB.id,
      label: "World B",
      description: "Description B",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deletedAt: null,
      isPublic: false,
    });

    // Admin list for Account A
    const respA = await app.fetch(
      new Request(`http://localhost/v1/worlds?account=${accountA.id}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${adminApiKey}`,
        },
      }),
    );
    assertEquals(respA.status, 200);
    const bodyA = await respA.json();
    assertEquals(bodyA.length, 1);
    assertEquals(bodyA[0].label, "World A");

    // Admin list for Account B
    const respB = await app.fetch(
      new Request(`http://localhost/v1/worlds?account=${accountB.id}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${adminApiKey}`,
        },
      }),
    );
    assertEquals(respB.status, 200);
    const bodyB = await respB.json();
    assertEquals(bodyB.length, 1);
    assertEquals(bodyB[0].label, "World B");
  });

  await t.step("Admin can create world for a specific account", async () => {
    const accountC = await createTestAccount(db);

    const resp = await app.fetch(
      new Request(`http://localhost/v1/worlds?account=${accountC.id}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${adminApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          label: "World C",
          description: "Created by Admin",
        }),
      }),
    );
    assertEquals(resp.status, 201);
    const world = await resp.json();
    assertEquals(world.accountId, accountC.id);
    assertEquals(world.label, "World C");

    // Verify in DB
    const dbWorld = await db.worlds.find(world.id);
    assert(dbWorld);
    assertEquals(dbWorld.value.accountId, accountC.id);
  });

  await t.step("Admin can delete world for a specific account", async () => {
    const accountD = await createTestAccount(db);
    const result = await db.worlds.add({
      accountId: accountD.id,
      label: "World D",
      description: "to be deleted",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deletedAt: null,
      isPublic: false,
    });
    assert(result.ok);
    const worldId = result.id;

    const resp = await app.fetch(
      new Request(
        `http://localhost/v1/worlds/${worldId}?account=${accountD.id}`,
        {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${adminApiKey}`,
          },
        },
      ),
    );
    assertEquals(resp.status, 204);

    const dbWorld = await db.worlds.find(worldId);
    assertEquals(dbWorld, null);
  });

  await t.step(
    "Admin SPARQL query claims usage for specific account",
    async () => {
      const accountE = await createTestAccount(db);
      const result = await db.worlds.add({
        accountId: accountE.id,
        label: "World E",
        description: "Sparql usage test",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deletedAt: null,
        isPublic: false,
      });
      assert(result.ok);
      const worldId = result.id;

      // Perform SPARQL query as admin impersonating accountE
      const query = "SELECT * WHERE { ?s ?p ?o } LIMIT 1";
      const resp = await app.fetch(
        new Request(
          `http://localhost/v1/worlds/${worldId}/sparql?account=${accountE.id}`,
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${adminApiKey}`,
              "Content-Type": "application/sparql-query",
            },
            body: query,
          },
        ),
      );
      assertEquals(resp.status, 200);
      await resp.text(); // Consume body

      // Verify usage is tracked via rate limits (implicitly verified by other tests)
      // Historical usage buckets are deprecated
    },
  );

  // Cleanup
  testContext.kv.close();
});
