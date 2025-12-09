import { Router } from "@fartlabs/rt";
import type { Quad, Term } from "oxigraph";
import type { AppContext } from "#/v1/context.ts";
import { auth } from "#/v1/auth.ts";

export default ({ oxigraphService, apiKeysService }: AppContext) => {
  return new Router()
    .get("/v1/stores/:store/sparql", async (ctx) => {
      const isAuthenticated = await auth(apiKeysService, ctx.request);
      if (!isAuthenticated) {
        return new Response("Unauthorized", { status: 401 });
      }

      const storeId = ctx.params?.pathname.groups.store;
      if (!storeId) return new Response("Store ID required", { status: 400 });

      const url = new URL(ctx.request.url);
      const query = url.searchParams.get("query");

      if (!query) {
        return Response.json({ error: "Missing query parameter" }, {
          status: 400,
        });
      }

      try {
        const result = await oxigraphService.query(storeId, query);
        return Response.json(serializeSparqlJson(result));
      } catch (err) {
        if (err instanceof Error && err.message === "Store not found") {
          return new Response("Store not found", { status: 404 });
        }
        return Response.json({ error: "Invalid Query" }, { status: 400 });
      }
    })
    .post("/v1/stores/:store/sparql", async (ctx) => {
      const isAuthenticated = await auth(apiKeysService, ctx.request);
      if (!isAuthenticated) {
        return new Response("Unauthorized", { status: 401 });
      }

      const storeId = ctx.params?.pathname.groups.store;
      if (!storeId) return new Response("Store ID required", { status: 400 });

      const contentType = ctx.request.headers.get("Content-Type");

      let query: string | undefined;
      let update: string | undefined;

      if (contentType === "application/sparql-query") {
        query = await ctx.request.text();
      } else if (contentType === "application/sparql-update") {
        update = await ctx.request.text();
      } else if (contentType === "application/x-www-form-urlencoded") {
        const formData = await ctx.request.formData();
        const q = formData.get("query");
        const u = formData.get("update");
        if (typeof q === "string") query = q;
        if (typeof u === "string") update = u;
      } else {
        return Response.json({ error: "Unsupported Content-Type" }, {
          status: 400,
        });
      }

      try {
        if (query) {
          const result = await oxigraphService.query(storeId, query);
          return Response.json(serializeSparqlJson(result));
        } else if (update) {
          await oxigraphService.update(storeId, update);
          return new Response(null, { status: 204 });
        } else {
          return Response.json({ error: "Missing query or update" }, {
            status: 400,
          });
        }
      } catch (err) {
        if (err instanceof Error && err.message === "Store not found") {
          return new Response("Store not found", { status: 404 });
        }
        return Response.json({ error: "Execution failed" }, { status: 400 });
      }
    });

  // Helper to serialize result to SPARQL Query Results JSON Format
  function serializeSparqlJson(
    result: boolean | Map<string, Term>[] | Quad[] | string,
  ): unknown {
    // Boolean result (ASK)
    if (typeof result === "boolean") {
      return { head: {}, boolean: result };
    }

    // SELECT result (Array of Maps) or CONSTRUCT result (Array of Quads)
    if (Array.isArray(result)) {
      if (result.length === 0) {
        return { head: { vars: [] }, results: { bindings: [] } };
      }

      if (result[0] instanceof Map) {
        const vars = new Set<string>();
        const bindings = (result as Map<string, Term>[]).map((binding) => {
          const obj: Record<string, unknown> = {};
          for (const [varName, term] of binding.entries()) {
            vars.add(varName);
            obj[varName] = serializeTerm(term);
          }
          return obj;
        });

        return {
          head: { vars: Array.from(vars) },
          results: { bindings },
        };
      } else {
        // CONSTRUCT/DESCRIBE result (Array of Quads)
        return (result as Quad[]).map((quad) => ({
          subject: serializeTerm(quad.subject),
          predicate: serializeTerm(quad.predicate),
          object: serializeTerm(quad.object),
          graph: serializeTerm(quad.graph),
        }));
      }
    }

    return result;
  }

  function serializeTerm(term: Term): unknown {
    if (term.termType === "NamedNode") {
      return { type: "uri", value: term.value };
    } else if (term.termType === "BlankNode") {
      return { type: "bnode", value: term.value };
    } else if (term.termType === "Literal") {
      const result: Record<string, string> = {
        type: "literal",
        value: term.value,
      };
      if (term.language) {
        result["xml:lang"] = term.language;
      } else if (
        term.datatype &&
        term.datatype.value !== "http://www.w3.org/2001/XMLSchema#string"
      ) {
        result.datatype = term.datatype.value;
      }
      return result;
    } else if (term.termType === "DefaultGraph") {
      return null;
    }

    return { type: "unknown", value: String(term.value) };
  }
};
