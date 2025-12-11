import { assert } from "@std/assert/assert";
import { kvAppContext } from "#/app-context.ts";
import storesApp from "#/v1/routes/stores/route.ts";
import storesSparqlApp from "#/v1/routes/stores/sparql/route.ts";
import { WorldsApiSdk } from "./worlds-api-sdk.ts";
import type { Account } from "#/accounts/accounts-service.ts";

const kv = await Deno.openKv(":memory:");
const appContext = kvAppContext(kv);

// Create a test account with access to test stores
const testAccount: Account = {
  id: "test-account",
  description: "Test account for SDK tests",
  plan: "free_plan",
  accessControl: {
    stores: ["non-existent-store", "test"],
  },
};
await appContext.accountsService.set(testAccount);

const testApiKey = "test-account";

Deno.test("e2e WorldsApiSdk", async (t) => {
  const sdk = new WorldsApiSdk({
    baseUrl: "http://localhost/v1",
    apiKey: testApiKey,
  });

  globalThis.fetch = (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const request = new Request(input, init);
    return storesApp(appContext).fetch(request);
  };

  await t.step("getStore returns null for non-existent store", async () => {
    const store = await sdk.getStore(
      "non-existent-store",
      "application/n-quads",
    );
    assert(store === null);
  });

  await t.step("setStore sets the store", async () => {
    await sdk.setStore(
      "test",
      '<http://example.com/s> <http://example.com/p> "o" .\n',
      "application/n-quads",
    );
  });

  await t.step("getStore returns data for existing store", async () => {
    const store = await sdk.getStore("test", "application/n-quads");
    assert(store !== null);
  });

  await t.step("addQuads adds quads to store", async () => {
    await sdk.addQuads(
      "test",
      '<http://example.com/s2> <http://example.com/p> "o2" .\n',
      "application/n-quads",
    );
  });

  globalThis.fetch = (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const request = new Request(input, init);
    return storesSparqlApp(appContext).fetch(request);
  };

  await t.step("query returns results for existing store", async () => {
    const results = await sdk.query(
      "test",
      "SELECT ?s ?p ?o WHERE { ?s ?p ?o }",
    );
    assert(Array.isArray(results));
    assert(results.length > 0);
  });

  await t.step("update updates the store", async () => {
    await sdk.update(
      "test",
      'INSERT DATA { <http://example.com/s3> <http://example.com/p> "o3" }',
    );
  });

  globalThis.fetch = (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const request = new Request(input, init);
    return storesApp(appContext).fetch(request);
  };

  await t.step("removeStore removes the store", async () => {
    await sdk.removeStore("test");
  });
});
