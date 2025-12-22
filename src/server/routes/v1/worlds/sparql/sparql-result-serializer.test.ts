import { assertEquals } from "@std/assert";

import { serializeSparqlResult } from "./sparql-result-serializer.ts";

Deno.test("serializeSparqlResult - boolean (true)", () => {
  const result = serializeSparqlResult(true);
  assertEquals(result, true);
});

Deno.test("serializeSparqlResult - boolean (false)", () => {
  const result = serializeSparqlResult(false);
  assertEquals(result, false);
});

// Add more tests if needed, avoiding unknown schemas for now or adding them after finding them
Deno.test("serializeSparqlResult - string", () => {
  const result = serializeSparqlResult("test");
  assertEquals(result, "test");
});
