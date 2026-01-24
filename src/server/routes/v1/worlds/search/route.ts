import { Router } from "@fartlabs/rt";
import { authorizeRequest } from "#/server/middleware/auth.ts";
import type { AppContext } from "#/server/app-context.ts";
import { LibsqlSearchStoreManager } from "#/server/search/libsql.ts";
import { checkRateLimit } from "#/server/middleware/rate-limit.ts";

export default (appContext: AppContext) => {
  return new Router().get(
    "/v1/worlds/:world/search",
    async (ctx) => {
      const worldId = ctx.params?.pathname.groups.world;
      if (!worldId) {
        return new Response("World ID required", { status: 400 });
      }

      const authorized = await authorizeRequest(appContext, ctx.request);
      if (!authorized.account && !authorized.admin) {
        return new Response("Unauthorized", { status: 401 });
      }

      const url = new URL(ctx.request.url);
      const query = url.searchParams.get("q");
      if (!query) {
        return new Response("Query required", { status: 400 });
      }

      const worldResult = await appContext.db.worlds.find(worldId);
      if (
        !worldResult || worldResult.value.deletedAt != null ||
        (worldResult.value.accountId !== authorized.account?.id &&
          !authorized.admin)
      ) {
        return new Response("World not found", { status: 404 });
      }

      // Apply rate limiting if account is present
      let rateLimitHeaders: Record<string, string> = {};
      if (authorized.account) {
        try {
          rateLimitHeaders = await checkRateLimit(
            appContext,
            authorized.account.id,
            worldId,
            { resourceType: "search" },
          );
        } catch (error) {
          if (error instanceof Response) return error; // 429 response
          throw error;
        }
      }

      const store = new LibsqlSearchStoreManager({
        client: appContext.libsqlClient,
        embeddings: appContext.embeddings,
      });
      await store.createTablesIfNotExists();

      const limit = url.searchParams.get("limit");
      try {
        const results = await store.search(query, {
          accountId: worldResult.value.accountId,
          worldIds: [worldId],
          limit: limit ? parseInt(limit, 10) : undefined,
        });
        return new Response(JSON.stringify(results), {
          headers: {
            "Content-Type": "application/json",
            ...rateLimitHeaders,
          },
        });
      } catch (error) {
        console.error("Search error:", error);
        return new Response("Search failed", { status: 500 });
      }
    },
  );
};
