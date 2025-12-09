import { assert, assertEquals } from "@std/assert";
import { createApp } from "../../../../../main.ts";
import { kvAppContext } from "#/v1/context.ts";

const kv = await Deno.openKv(":memory:");
const app = await createApp(kvAppContext(kv));

Deno.test("GET /v1/stores/{store}/sparql executes SPARQL Query", async () => {
  const storeId = "test-store-sparql-get";

  // Setup data via API
  const initialBody = '<http://example.com/s> <http://example.com/p> "o" .\n';
  await app.fetch(
    new Request(`http://localhost/v1/stores/${storeId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/n-quads",
        "Authorization": "Bearer test-token",
      },
      body: initialBody,
    }),
  );

  const query = encodeURIComponent("SELECT ?s WHERE { ?s ?p ?o }");
  const req = new Request(
    `http://localhost/v1/stores/${storeId}/sparql?query=${query}`,
    {
      method: "GET",
      headers: {
        "Accept": "application/sparql-results+json",
        "Authorization": "Bearer test-token",
      },
    },
  );

  const res = await app.fetch(req);
  assertEquals(res.status, 200);
  const json = await res.json();

  // Check Standard SPARQL JSON Structure
  assert(json.head);
  assert(json.results);
  assert(Array.isArray(json.results.bindings));
  assertEquals(json.results.bindings.length, 1);

  const binding = json.results.bindings[0];
  assertEquals(binding.s.type, "uri");
  assertEquals(binding.s.value, "http://example.com/s");
});

Deno.test("POST /v1/stores/{store}/sparql (form-urlencoded) executes SPARQL Query", async () => {
  const storeId = "test-store-sparql-post-form";

  // Setup data via API
  const initialBody = '<http://example.com/s> <http://example.com/p> "o" .\n';
  await app.fetch(
    new Request(`http://localhost/v1/stores/${storeId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/n-quads",
        "Authorization": "Bearer test-token",
      },
      body: initialBody,
    }),
  );

  const body = new URLSearchParams({ query: "SELECT ?s WHERE { ?s ?p ?o }" });
  const req = new Request(`http://localhost/v1/stores/${storeId}/sparql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/sparql-results+json",
      "Authorization": "Bearer test-token",
    },
    body: body.toString(),
  });

  const res = await app.fetch(req);
  assertEquals(res.status, 200);
  const json = await res.json();

  // Check Standard SPARQL JSON Structure
  assert(json.head);
  assert(json.results);
  assert(Array.isArray(json.results.bindings));
  assertEquals(json.results.bindings.length, 1);
});

Deno.test("POST /v1/stores/{store}/sparql (direct) executes SPARQL Update", async () => {
  const storeId = "test-store-sparql-update-direct";

  // Initialize store (empty)
  await app.fetch(
    new Request(`http://localhost/v1/stores/${storeId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/n-quads",
        "Authorization": "Bearer test-token",
      },
      body: "",
    }),
  );

  const update =
    'INSERT DATA { <http://example.com/s> <http://example.com/p> "o" }';
  const req = new Request(`http://localhost/v1/stores/${storeId}/sparql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/sparql-update",
      "Authorization": "Bearer test-token",
    },
    body: update,
  });

  const res = await app.fetch(req);
  assertEquals(res.status, 204);

  // Verify using query
  const query = encodeURIComponent("SELECT * WHERE { ?s ?p ?o }");
  const resQuery = await app.fetch(
    new Request(
      `http://localhost/v1/stores/${storeId}/sparql?query=${query}`,
      {
        method: "GET",
        headers: { "Authorization": "Bearer test-token" },
      },
    ),
  );
  const json = await resQuery.json();
  assertEquals(json.results.bindings.length, 1);
});
