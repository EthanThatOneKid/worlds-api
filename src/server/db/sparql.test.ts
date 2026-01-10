import { assert, assertEquals } from "@std/assert";
import { sparql } from "./sparql.ts";
import { setWorldAsN3Store } from "./n3.ts";
import { DataFactory, Store } from "n3";

const { namedNode, literal, quad } = DataFactory;

/**
 * Helper to parse SPARQL JSON response
 */
async function parseSparqlResponse(response: Response) {
  const text = await response.text();
  return JSON.parse(text);
}

Deno.test("SPARQL Layer", async (t) => {
  const kv = await Deno.openKv(":memory:");

  await t.step("SELECT on empty world returns empty results", async () => {
    const worldId = "sparql-empty";
    const query = "SELECT * WHERE { ?s ?p ?o }";
    const response = await sparql(kv, worldId, query);

    assertEquals(
      response.headers.get("Content-Type"),
      "application/sparql-results+json",
    );
    const json = await parseSparqlResponse(response);
    assertEquals(json.results.bindings.length, 0);
  });

  await t.step("INSERT DATA updates the world", async () => {
    const worldId = "sparql-write";
    const insertQuery = `
      INSERT DATA {
        <http://example.org/s> <http://example.org/p> "object" .
      }
    `;
    const response = await sparql(kv, worldId, insertQuery);
    // INSERT queries often return void or boolean, check if ok
    assert(response.ok);

    // Verify persistence
    const selectQuery =
      "SELECT ?o WHERE { <http://example.org/s> <http://example.org/p> ?o }";
    const selectResponse = await sparql(kv, worldId, selectQuery);
    const json = await parseSparqlResponse(selectResponse);

    assertEquals(json.results.bindings.length, 1);
    assertEquals(json.results.bindings[0].o.value, "object");
  });

  await t.step("SELECT queries existing data", async () => {
    const worldId = "sparql-read";

    // Pre-populate directly via N3 layer to ensure strict layering test (bottom-up)
    const store = new Store();
    store.addQuad(quad(
      namedNode("http://a"),
      namedNode("http://b"),
      literal("c"),
    ));
    await setWorldAsN3Store(kv, worldId, store);

    const query = "SELECT ?s WHERE { ?s <http://b> 'c' }";
    const response = await sparql(kv, worldId, query);
    const json = await parseSparqlResponse(response);

    assertEquals(json.results.bindings.length, 1);
    assertEquals(json.results.bindings[0].s.value, "http://a");
  });

  kv.close();
});
