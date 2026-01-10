import { assertEquals } from "@std/assert";
import { getWorldAsBlob, setWorldAsBlob } from "./blob.ts";

Deno.test("Blob Layer", async (t) => {
  const kv = await Deno.openKv(":memory:");

  await t.step(
    "getWorldAsBlob returns null for non-existent world",
    async () => {
      const result = await getWorldAsBlob(kv, "non-existent-world");
      assertEquals(result, null);
    },
  );

  await t.step("setWorldAsBlob and getWorldAsBlob round trip", async () => {
    const worldId = "test-world";
    const data = "Hello, World!";
    const blob = new Blob([data], { type: "text/plain" });

    await setWorldAsBlob(kv, worldId, blob);

    const result = await getWorldAsBlob(kv, worldId);
    assertEquals(result?.type, "text/plain");
    const text = await result?.text();
    assertEquals(text, data);
  });

  await t.step("setWorldAsBlob overwrites existing blob", async () => {
    const worldId = "overwrite-world";
    const blob1 = new Blob(["First"], { type: "text/plain" });
    const blob2 = new Blob(["Second"], { type: "text/plain" });

    await setWorldAsBlob(kv, worldId, blob1);
    let result = await getWorldAsBlob(kv, worldId);
    assertEquals(await result?.text(), "First");

    await setWorldAsBlob(kv, worldId, blob2);
    result = await getWorldAsBlob(kv, worldId);
    assertEquals(await result?.text(), "Second");
  });

  kv.close();
});
