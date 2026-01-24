import { assertEquals } from "@std/assert";
import {
  DefaultPolicy,
  getPlanPolicy,
  getPolicy,
  Policies,
} from "./policies.ts";

Deno.test("getPlanPolicy - returns specific plan policy", () => {
  assertEquals(getPlanPolicy("free"), Policies.free);
  assertEquals(getPlanPolicy("pro"), Policies.pro);
  assertEquals(getPlanPolicy("test"), Policies.test);
});

Deno.test("getPlanPolicy - returns shadow policy for null/empty plan", () => {
  assertEquals(getPlanPolicy(null), Policies.shadow);
  assertEquals(getPlanPolicy(""), Policies.shadow);
});

Deno.test("getPlanPolicy - returns default policy for unknown plan", () => {
  assertEquals(getPlanPolicy("unknown"), DefaultPolicy);
});

Deno.test("getPolicy - returns specific resource policy for plan", () => {
  const policy = getPolicy("free", "sparql_query");
  assertEquals(policy, Policies.free.rateLimits.sparql_query);
});

Deno.test("getPolicy - returns fallback resource policy from DefaultPolicy", () => {
  // Mock a scenario where a plan exists but lacks a specific resource limit (if possible)
  // Since ResourceType is a union and Record<ResourceType, ...> is used,
  // we are testing the fallback logic in getPolicy.

  // getPolicy uses DefaultPolicy.rateLimits[resource] as fallback
  const policy = getPolicy("non-existent-plan", "world_download");
  assertEquals(policy, DefaultPolicy.rateLimits.world_download);
});
