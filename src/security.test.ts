import { assertEquals } from "@std/assert";
import app from "./main.ts";

Deno.test("Security: API requires Bearer authentication", async (t) => {
  await t.step("returns 401 Unauthorized when no token provided", async () => {
    const res = await app.request("/v1/stores/test-store", {
      method: "GET",
    });
    assertEquals(res.status, 401);
  });

  await t.step(
    "returns 401 Unauthorized when invalid token provided",
    async () => {
      const res = await app.request("/v1/stores/test-store", {
        method: "GET",
        headers: {
          "Authorization": "Bearer invalid-token-123",
        },
      });
      assertEquals(res.status, 401);
    },
  );

  await t.step("allows access with valid token", async () => {
    // Assuming "test-token" is the default fallback in main.ts
    const res = await app.request("/v1/stores/test-store", {
      method: "GET",
      headers: {
        "Authorization": "Bearer test-token",
      },
    });
    // Should be 404 (Store not found) or 200, but NOT 401.
    // Since store doesn't exist, likely 404.
    assertEquals(res.status, 404);
  });
});
