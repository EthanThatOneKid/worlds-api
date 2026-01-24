import { assertEquals } from "@std/assert";
import { createWorldsKvdex } from "#/server/db/kvdex.ts";
import { DataFactory } from "n3";
import route from "./route.ts";
import { createClient } from "@libsql/client";
import { LibsqlSearchStoreManager } from "#/server/search/libsql.ts";

Deno.test("Search API - Top-Level Route", async (t) => {
  const kv = await Deno.openKv(":memory:");
  const db = createWorldsKvdex(kv);

  const client = createClient({ url: ":memory:" });
  const embedder = {
    embed: (_: string) => Promise.resolve(new Array(768).fill(0)),
    dimensions: 768,
  };
  const appContext = { db, kv, libsqlClient: client, embeddings: embedder };
  const adminHandler = route({ ...appContext, admin: { apiKey: "admin-key" } });

  const accountId = "test-account";

  // Create two worlds
  const world1Result = await db.worlds.add({
    accountId,
    label: "World 1",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  const world2Result = await db.worlds.add({
    accountId,
    label: "World 2",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  if (!world1Result.ok || !world2Result.ok) {
    throw new Error("Failed to add worlds");
  }

  const worldId1 = world1Result.id;
  const worldId2 = world2Result.id;

  // Sync to search store using LibsqlSearchStore
  const searchStore = new LibsqlSearchStoreManager({
    client,
    embeddings: embedder,
  });
  await searchStore.createTablesIfNotExists();

  const testQuad1 = DataFactory.quad(
    DataFactory.namedNode("http://example.org/s1"),
    DataFactory.namedNode("http://example.org/p1"),
    DataFactory.literal("Hello Earth"),
  );
  const testQuad2 = DataFactory.quad(
    DataFactory.namedNode("http://example.org/s2"),
    DataFactory.namedNode("http://example.org/p2"),
    DataFactory.literal("Hello Mars"),
  );

  await searchStore.patch(accountId, worldId1, [{
    deletions: [],
    insertions: [testQuad1],
  }]);
  await searchStore.patch(accountId, worldId2, [{
    deletions: [],
    insertions: [testQuad2],
  }]);

  await t.step("GET /v1/search requires query", async () => {
    const resp = await adminHandler.fetch(
      new Request("http://localhost/v1/search", {
        headers: { "Authorization": "Bearer admin-key" },
      }),
    );
    assertEquals(resp.status, 400);
  });

  await t.step("GET /v1/search across all worlds of account", async () => {
    const resp = await adminHandler.fetch(
      new Request(`http://localhost/v1/search?q=Hello&account=${accountId}`, {
        headers: { "Authorization": "Bearer admin-key" },
      }),
    );
    assertEquals(resp.status, 200);
    const body = await resp.json();
    assertEquals(Array.isArray(body), true);
    assertEquals(body.length, 2);
  });

  await t.step("GET /v1/search filtered by specific worlds", async () => {
    const resp = await adminHandler.fetch(
      new Request(
        `http://localhost/v1/search?q=Hello&worlds=${worldId1}&account=${accountId}`,
        {
          headers: { "Authorization": "Bearer admin-key" },
        },
      ),
    );
    assertEquals(resp.status, 200);
    const body = await resp.json();
    assertEquals(body.length, 1);
    assertEquals(body[0].value.worldId, worldId1);
  });

  await t.step("GET /v1/search validates world access", async () => {
    const resp = await adminHandler.fetch(
      new Request(
        `http://localhost/v1/search?q=Hello&worlds=other-world&account=${accountId}`,
        {
          headers: { "Authorization": "Bearer admin-key" },
        },
      ),
    );
    assertEquals(resp.status, 404); // "No valid worlds found"
  });

  kv.close();
});
