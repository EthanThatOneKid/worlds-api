import { assert, assertEquals } from "@std/assert";
import { createTestAccount, createTestContext } from "#/server/testing.ts";
import { createServer } from "#/server/server.ts";
import { WorldsSdk } from "#/sdk/mod.ts";

Deno.test("GET /v1/worlds/:world/conversations", async () => {
  const context = await createTestContext();
  const server = await createServer(context);
  const account = await createTestAccount(context.db);

  const sdk = new WorldsSdk({
    baseUrl: "http://localhost/v1",
    apiKey: account.apiKey,
    fetch: (url, init) => server.fetch(new Request(url, init)),
  });

  const worldRecord = await sdk.worlds.create({
    accountId: account.id,
    label: "Test World",
    description: "Test World",
    isPublic: false,
  }, { accountId: account.id });

  // Seed conversations
  const now = Date.now();
  const conversation1 = {
    id: crypto.randomUUID(),
    worldId: worldRecord.id,
    createdAt: now - 1000,
    updatedAt: now - 1000,
    metadata: { key: "value1" },
  };
  const conversation2 = {
    id: crypto.randomUUID(),
    worldId: worldRecord.id,
    createdAt: now,
    updatedAt: now,
    metadata: { key: "value2" },
  };

  const result1 = await context.db.conversations.add(conversation1);
  const result2 = await context.db.conversations.add(conversation2);

  assert(result1.ok);
  assert(result2.ok);

  const conversations = await sdk.conversations.list(worldRecord.id, {
    accountId: account.id,
  });

  assertEquals(conversations.length, 2);
  assertEquals(conversations[0].id, result2.id); // Sorted by updatedAt desc
  assertEquals(conversations[1].id, result1.id);

  context.kv.close();
  context.libsqlClient.close();
});

Deno.test("GET /v1/worlds/:world/conversations/:conversation/messages", async () => {
  const context = await createTestContext();
  const server = await createServer(context);
  const account = await createTestAccount(context.db);

  const sdk = new WorldsSdk({
    baseUrl: "http://localhost/v1",
    apiKey: account.apiKey,
    fetch: (url, init) => server.fetch(new Request(url, init)),
  });

  const worldRecord = await sdk.worlds.create({
    accountId: account.id,
    label: "Test World",
    description: "Test World",
    isPublic: false,
  }, { accountId: account.id });

  // Seed conversation
  const now = Date.now();
  const conversation = {
    id: crypto.randomUUID(),
    worldId: worldRecord.id,
    createdAt: now,
    updatedAt: now,
  };
  const conversationResult = await context.db.conversations.add(conversation);
  assert(conversationResult.ok);
  const conversationId = conversationResult.id;

  // Seed messages
  const message1 = {
    id: crypto.randomUUID(),
    worldId: worldRecord.id,
    conversationId,
    content: { role: "user" as const, content: "Hello" },
    createdAt: now - 1000,
  };
  const message2 = {
    id: crypto.randomUUID(),
    worldId: worldRecord.id,
    conversationId,
    content: { role: "assistant" as const, content: "Hi there" },
    createdAt: now,
  };

  await context.db.messages.add(message1);
  await context.db.messages.add(message2);

  const messages = await sdk.messages.list(worldRecord.id, conversationId, {
    accountId: account.id,
  });

  assertEquals(messages.length, 2);
  assertEquals(messages[0].content.content, "Hello");
  assertEquals(messages[1].content.content, "Hi there");

  context.kv.close();
  context.libsqlClient.close();
});
