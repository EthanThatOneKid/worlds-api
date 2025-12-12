import { assert } from "@std/assert/assert";
import { kvAppContext } from "#/app-context.ts";
import worldsApp from "#/v1/routes/worlds/route.ts";
import worldsSparqlApp from "#/v1/routes/worlds/sparql/route.ts";
import usageApp from "#/v1/routes/usage/route.ts";
import type { Account } from "#/accounts/accounts-service.ts";
import { Worlds } from "./worlds.ts";

const kv = await Deno.openKv(":memory:");
const appContext = kvAppContext(kv);

// Create a test account with access to test worlds
const testAccount: Account = {
  id: "test-account",
  apiKey: "sk_test_sdk_worlds",
  description: "Test account for SDK tests",
  plan: "free_plan",
  accessControl: {
    worlds: ["non-existent-world", "test"],
  },
};
await appContext.accountsService.set(testAccount);

const testApiKey = "sk_test_sdk_worlds";

Deno.test("e2e Worlds", async (t) => {
  const sdk = new Worlds({
    baseUrl: "http://localhost/v1",
    apiKey: testApiKey,
  });

  globalThis.fetch = ((
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const request = new Request(input, init);
    return worldsApp(appContext).fetch(request);
  }) as unknown as typeof fetch;

  await t.step("getWorld returns null for non-existent world", async () => {
    const world = await sdk.getWorld(
      "non-existent-world",
      "application/n-quads",
    );
    assert(world === null);
  });

  await t.step("setWorld sets the world", async () => {
    await sdk.setWorld(
      "test",
      '<http://example.com/s> <http://example.com/p> "o" .\n',
      "application/n-quads",
    );
  });

  await t.step("getWorld returns data for existing world", async () => {
    const world = await sdk.getWorld("test", "application/n-quads");
    assert(world !== null);
  });

  await t.step("addQuads adds quads to world", async () => {
    await sdk.addQuads(
      "test",
      '<http://example.com/s2> <http://example.com/p> "o2" .\n',
      "application/n-quads",
    );
  });

  globalThis.fetch = ((
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const request = new Request(input, init);
    return worldsSparqlApp(appContext).fetch(request);
  }) as typeof fetch;

  await t.step("queryWorld returns results for existing world", async () => {
    const results = await sdk.queryWorld(
      "test",
      "SELECT ?s ?p ?o WHERE { ?s ?p ?o }",
    );
    assert(Array.isArray(results));
    assert(results.length > 0);
  });

  await t.step("updateWorld updates the world", async () => {
    await sdk.updateWorld(
      "test",
      'INSERT DATA { <http://example.com/s3> <http://example.com/p> "o3" }',
    );
  });

  globalThis.fetch = ((
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const request = new Request(input, init);
    return worldsApp(appContext).fetch(request);
  }) as unknown as typeof fetch;

  await t.step("getWorld returns metadata for application/json", async () => {
    const metadataStr = await sdk.getWorld("test", "application/json");
    assert(metadataStr !== null);
    const metadata = JSON.parse(metadataStr!);
    assert(metadata.id === "test");
    assert(typeof metadata.size === "number");
  });

  await t.step("updateWorldDescription updates the description", async () => {
    await sdk.updateWorldDescription("test", "A test description");
    const metadataStr = await sdk.getWorld("test", "application/json");
    assert(metadataStr !== null);
    const metadata = JSON.parse(metadataStr!);
    assert(metadata.description === "A test description");
  });

  await t.step("removeWorld removes the world", async () => {
    await sdk.removeWorld("test");
  });

  globalThis.fetch = ((
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const request = new Request(input, init);
    return usageApp(appContext).fetch(request);
  }) as unknown as typeof fetch;

  await t.step("getUsage returns usage summary", async () => {
    const usage = await sdk.getUsage();
    assert(typeof usage === "object");
    assert(usage.worlds !== undefined);
  });
});
