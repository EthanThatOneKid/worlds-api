import { assertEquals } from "@std/assert";
import { createApp } from "../../../../main.ts";
import { kvAppContext } from "#/v1/context.ts";

const kv = await Deno.openKv(":memory:");
const app = await createApp(kvAppContext(kv));

Deno.test("POST /v1/stores/{store} appends data", async () => {
  const storeId = "test-store-api";

  const initialBody = '<http://example.com/s1> <http://example.com/p> "o1" .\n';
  const reqInit = new Request(`http://localhost/v1/stores/${storeId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/n-quads",
      "Authorization": "Bearer test-token",
    },
    body: initialBody,
  });
  await app.fetch(reqInit);

  // Make request to append
  const body = '<http://example.com/s2> <http://example.com/p> "o2" .\n';
  const req = new Request(`http://localhost/v1/stores/${storeId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/n-quads",
      "Authorization": "Bearer test-token",
    },
    body: body,
  });

  const res = await app.fetch(req);
  assertEquals(res.status, 204);

  // Verify using GET endpoint
  const reqGet = new Request(`http://localhost/v1/stores/${storeId}`, {
    method: "GET",
    headers: {
      "Accept": "application/n-quads",
      "Authorization": "Bearer test-token",
    },
  });
  const resGet = await app.fetch(reqGet);
  assertEquals(resGet.status, 200);
  const bodyGet = await resGet.text();
  // Simple check
  assertEquals(bodyGet.includes('"o1"'), true);
  assertEquals(bodyGet.includes('"o2"'), true);
});
