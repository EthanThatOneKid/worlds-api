import { Router } from "@fartlabs/rt";
import { authorizeRequest } from "#/server/middleware/auth.ts";
import type { AppContext } from "#/server/app-context.ts";

export default (appContext: AppContext) => {
  return new Router().get(
    "/v1/worlds/search",
    async (ctx) => {
      const authorized = await authorizeRequest(appContext, ctx.request);
      if (!authorized.account && !authorized.admin) {
        return new Response("Unauthorized", { status: 401 });
      }

      const url = new URL(ctx.request.url);
      const query = url.searchParams.get("q");
      if (!query) {
        return new Response("Query required", { status: 400 });
      }

      // TODO: Implement actual search logic
      return Response.json({
        results: [],
        query,
      });
    },
  );
};
