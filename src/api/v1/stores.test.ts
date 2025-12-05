import { assertEquals } from "@std/assert/equals";
import { toArrayBuffer } from "@std/streams";
import { OpenAPIHono } from "@hono/zod-openapi";
import { namedNode, quad, Store } from "oxigraph";
import {
  encodableEncodings,
  encodeStore,
} from "#/oxigraph/oxigraph-encoding.ts";
import { DenoKvOxigraphService } from "#/oxigraph/deno-kv-oxigraph-service.ts";
import { app as storeApp, withOxigraphService } from "./stores.ts";

// Encode a fake store.
const store = new Store([
  quad(
    namedNode("http://example.com/subject"),
    namedNode("http://example.com/predicate"),
    namedNode("http://example.com/object"),
  ),
]);

// Helper to get encoded bytes
const getEncodedBytes = async () => {
  const stream = encodeStore(store, encodableEncodings.nq);
  return new Uint8Array(await toArrayBuffer(stream));
};

// Use in-memory kv for testing.
const kv = await Deno.openKv(":memory:");
const oxigraphService = new DenoKvOxigraphService(kv);

const app = new OpenAPIHono();
app.use(withOxigraphService(oxigraphService));

// Mount the store app.
app.route("/v1", storeApp);

Deno.test("e2e Stores API", async (t) => {
  const encodedBytes = await getEncodedBytes();

  // Set the store.
  await t.step("POST /stores/{store}", async () => {
    const response = await app.request("/v1/stores/test-store", {
      method: "POST",
      body: encodedBytes,
      headers: {
        "Content-Type": encodableEncodings.nq,
      },
    });
    assertEquals(response.status, 201);
  });

  // Get the store.
  await t.step("GET /stores/{store}", async () => {
    const response = await app.request("/v1/stores/test-store", {
      method: "GET",
      headers: {
        "Accept": encodableEncodings.nq,
      },
    });
    assertEquals(response.status, 200);

    const body = await response.bytes();
    assertEquals(body, encodedBytes);
  });

  // Delete the store.
  await t.step("DELETE /stores/{store}", async () => {
    const response = await app.request("/v1/stores/test-store", {
      method: "DELETE",
    });
    assertEquals(response.status, 204);
  });
});
