// @deno-types="@types/n3"
import { DataFactory, Store } from "n3";
import { assertEquals } from "@std/assert";
import { getWorldAsN3Store, setWorldAsN3Store } from "./n3.ts";

const { namedNode, literal, quad } = DataFactory;

Deno.test("N3 Layer", async (t) => {
  const kv = await Deno.openKv(":memory:");

  await t.step(
    "getWorldAsN3Store returns empty store for non-existent world",
    async () => {
      const store = await getWorldAsN3Store(kv, "non-existent-world");
      assertEquals(store.size, 0);
    },
  );

  await t.step(
    "setWorldAsN3Store and getWorldAsN3Store round trip",
    async () => {
      const worldId = "test-n3-world";
      const store = new Store();
      store.addQuad(
        quad(
          namedNode("http://example.org/subject"),
          namedNode("http://example.org/predicate"),
          literal("object"),
        ),
      );

      await setWorldAsN3Store(kv, worldId, store);

      const resultStore = await getWorldAsN3Store(kv, worldId);
      assertEquals(resultStore.size, 1);
      const quads = resultStore.getQuads(null, null, null, null);
      assertEquals(quads[0].subject.value, "http://example.org/subject");
      assertEquals(quads[0].predicate.value, "http://example.org/predicate");
      assertEquals(quads[0].object.value, "object");
    },
  );

  await t.step("getWorldAsN3Store parses existing data correctly", async () => {
    // This implicitly tests integration with Blob layer via n3 helper
    const worldId = "parsing-world";
    const store = new Store();
    store.addQuad(
      quad(
        namedNode("http://example.org/s"),
        namedNode("http://example.org/p"),
        namedNode("http://example.org/o"),
      ),
    );
    await setWorldAsN3Store(kv, worldId, store);

    const retrieved = await getWorldAsN3Store(kv, worldId);
    assertEquals(retrieved.size, 1);
  });

  kv.close();
});
