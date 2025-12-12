import { Router } from "@fartlabs/rt";
import { accepts } from "@std/http/negotiation";
import { ulid } from "@std/ulid/ulid";
import type {
  DecodableEncoding,
  EncodableEncoding,
} from "#/oxigraph/oxigraph-encoding.ts";
import {
  decodableEncodings,
  decodeStore,
  encodableEncodings,
  encodeStore,
} from "#/oxigraph/oxigraph-encoding.ts";
import type { AppContext } from "#/app-context.ts";
import { plans, reachedPlanLimit } from "#/accounts/plans.ts";
import { authorizeRequest } from "#/accounts/authorize.ts";

export default ({ oxigraphService, accountsService }: AppContext) => {
  return new Router()
    .get(
      "/v1/worlds/:world",
      async (ctx) => {
        const authorized = await authorizeRequest(accountsService, ctx.request);

        if (!authorized) {
          return new Response("Unauthorized", { status: 401 });
        }

        const worldId = ctx.params?.pathname.groups.world;
        if (!worldId) {
          return new Response("World ID required", { status: 400 });
        }

        if (
          !authorized.admin &&
          !authorized.account?.accessControl.worlds.includes(worldId)
        ) {
          return new Response("World not found", { status: 404 });
        }

        const metadata = await oxigraphService.getMetadata(worldId);
        if (!metadata) {
          return new Response("World not found", { status: 404 });
        }

        const supported = [
          "application/json",
          ...Object.values(encodableEncodings),
        ];
        const encoding = accepts(ctx.request, ...supported) ??
          "application/json";
        if (encoding === "application/json") {
          return Response.json(metadata);
        }

        if (
          !(Object.values(encodableEncodings) as string[]).includes(encoding)
        ) {
          return new Response("Unsupported encoding", { status: 400 });
        }

        try {
          const store = await oxigraphService.getStore(worldId);
          if (!store) {
            return new Response("World not found", { status: 404 });
          }

          const data = encodeStore(store, encoding as EncodableEncoding);
          if (authorized.account) {
            const timestamp = Date.now();
            const id = ulid(timestamp);
            await accountsService.meter({
              id,
              timestamp,
              accountId: authorized.account.id,
              endpoint: "GET /worlds/{worldId}",
              params: { worldId },
              statusCode: 200,
            });
          }
          return new Response(data, {
            headers: { "Content-Type": encoding },
          });
        } catch (_error) {
          return Response.json({ error: "Encoding failed" }, { status: 500 });
        }
      },
    )
    .get(
      "/v1/worlds/:world/usage",
      async (ctx) => {
        const authorized = await authorizeRequest(accountsService, ctx.request);

        if (!authorized) {
          return new Response("Unauthorized", { status: 401 });
        }

        const worldId = ctx.params?.pathname.groups.world;
        if (!worldId) {
          return new Response("World ID required", { status: 400 });
        }

        if (
          !authorized.admin &&
          !authorized.account?.accessControl.worlds.includes(worldId)
        ) {
          return new Response("World not found", { status: 404 });
        }

        const accountId = authorized.account?.id;
        if (!accountId) {
          if (authorized.admin) {
            return new Response("Account context required", { status: 400 });
          }
          // Should not happen if authorized is valid but handled for safety
          return new Response("Unauthorized", { status: 401 });
        }

        const usageSummary = await accountsService.getUsageSummary(accountId);

        const worldUsage = usageSummary?.worlds[worldId] ||
          { reads: 0, writes: 0 };
        return Response.json(worldUsage);
      },
    )
    .put(
      "/v1/worlds/:world",
      async (ctx) => {
        const authorized = await authorizeRequest(accountsService, ctx.request);

        if (!authorized) {
          return new Response("Unauthorized", { status: 401 });
        }

        const worldId = ctx.params?.pathname.groups.world;
        if (!worldId) {
          return new Response("World ID required", { status: 400 });
        }

        if (!authorized.admin && !authorized.account) {
          return new Response("Unauthorized", { status: 401 });
        }

        // Check if world already exists
        const existingMetadata = await oxigraphService.getMetadata(worldId);

        // For existing worlds, verify access
        if (existingMetadata) {
          if (
            !authorized.admin &&
            !authorized.account?.accessControl.worlds.includes(worldId)
          ) {
            // Privacy: Return 404 instead of 401 to hide existence
            return new Response("World not found", { status: 404 });
          }
        } else {
          // For new worlds, check plan limits (skip for admin)
          if (!authorized.admin && authorized.account) {
            if (reachedPlanLimit(authorized.account)) {
              return Response.json(
                {
                  error: "Plan limit reached",
                  limit: plans[authorized.account.plan].worlds,
                },
                { status: 403 },
              );
            }

            // Add world to account's access control
            await accountsService.addWorldAccess(
              authorized.account.id,
              worldId,
            );
            authorized.account.accessControl.worlds.push(worldId);
          }
        }

        const contentType = ctx.request.headers.get("Content-Type");

        if (!contentType) {
          return Response.json({ error: "Content-Type required" }, {
            status: 400,
          });
        }

        if (
          !(Object.values(decodableEncodings) as string[]).includes(
            contentType,
          )
        ) {
          return Response.json({ error: "Unsupported Content-Type" }, {
            status: 400,
          });
        }

        const bodyText = await ctx.request.text();

        try {
          const stream = new Blob([bodyText]).stream();
          const store = await decodeStore(
            stream,
            contentType as DecodableEncoding,
          );

          // Determine owner: use account ID if available, otherwise "admin" if admin
          const owner = authorized.account?.id ||
            (authorized.admin ? "admin" : "unknown");
          if (owner === "unknown") {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }

          await oxigraphService.setStore(worldId, owner, store);
          if (authorized.account) {
            const timestamp = Date.now();
            const id = ulid(timestamp);
            await accountsService.meter({
              id,
              timestamp,
              accountId: authorized.account.id,
              endpoint: "PUT /worlds/{worldId}",
              params: { worldId },
              statusCode: 204,
            });
          }
          return new Response(null, { status: 204 });
        } catch (error) {
          return Response.json(
            { error: "Invalid RDF Syntax", details: String(error) },
            { status: 400 },
          );
        }
      },
    )
    .post(
      "/v1/worlds/:world",
      async (ctx) => {
        const authorized = await authorizeRequest(accountsService, ctx.request);

        if (!authorized) {
          return new Response("Unauthorized", { status: 401 });
        }

        const worldId = ctx.params?.pathname.groups.world;
        if (!worldId) {
          return new Response("World ID required", { status: 400 });
        }

        if (!authorized.admin && !authorized.account) {
          return new Response("Unauthorized", { status: 401 });
        }

        // Check if world already exists
        const existingMetadata = await oxigraphService.getMetadata(worldId);

        // For existing worlds, verify access
        if (existingMetadata) {
          if (
            !authorized.admin &&
            !authorized.account?.accessControl.worlds.includes(worldId)
          ) {
            // Privacy: Return 404 instead of 401 to hide existence
            return new Response("World not found", { status: 404 });
          }
        } else {
          // For new worlds, check plan limits (skip for admin)
          if (!authorized.admin && authorized.account) {
            if (reachedPlanLimit(authorized.account)) {
              return Response.json(
                {
                  error: "Plan limit reached",
                  limit: plans[authorized.account.plan].worlds,
                },
                { status: 403 },
              );
            }

            // Add world to account's access control
            await accountsService.addWorldAccess(
              authorized.account.id,
              worldId,
            );
            authorized.account.accessControl.worlds.push(worldId);
          }
        }

        const contentType = ctx.request.headers.get("Content-Type");

        if (!contentType) {
          return Response.json({ error: "Content-Type required" }, {
            status: 400,
          });
        }

        if (
          !(Object.values(decodableEncodings) as string[]).includes(
            contentType,
          )
        ) {
          return Response.json({ error: "Unsupported Content-Type" }, {
            status: 400,
          });
        }

        const bodyText = await ctx.request.text();

        try {
          const stream = new Blob([bodyText]).stream();
          const store = await decodeStore(
            stream,
            contentType as DecodableEncoding,
          );

          // Determine owner: use account ID if available, otherwise "admin" if admin
          const owner = authorized.account?.id ||
            (authorized.admin ? "admin" : "unknown");
          if (owner === "unknown") {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }

          await oxigraphService.addQuads(worldId, owner, store.match());
          if (authorized.account) {
            const timestamp = Date.now();
            const id = ulid(timestamp);
            await accountsService.meter({
              id,
              timestamp,
              accountId: authorized.account.id,
              endpoint: "POST /worlds/{worldId}",
              params: { worldId },
              statusCode: 204,
            });
          }
          return new Response(null, { status: 204 });
        } catch (error) {
          return Response.json(
            { error: "Invalid RDF Syntax", details: String(error) },
            { status: 400 },
          );
        }
      },
    )
    .delete(
      "/v1/worlds/:world",
      async (ctx) => {
        const authorized = await authorizeRequest(accountsService, ctx.request);

        if (!authorized) {
          return new Response("Unauthorized", { status: 401 });
        }

        const worldId = ctx.params?.pathname.groups.world;
        if (!worldId) {
          return new Response("World ID required", { status: 400 });
        }

        // Get world metadata to check ownership
        const metadata = await oxigraphService.getMetadata(worldId);

        // Privacy check: verify access list first
        if (
          !authorized.admin &&
          !authorized.account?.accessControl.worlds.includes(worldId)
        ) {
          return new Response("World not found", { status: 404 });
        }

        if (!metadata) {
          return new Response("World not found", { status: 404 });
        }

        // Only allow deletion by owner or admin
        if (!authorized.admin) {
          if (
            !authorized.account ||
            metadata.createdBy !== authorized.account.id
          ) {
            return Response.json(
              {
                error: "Forbidden: Only the world owner can delete this world",
              },
              { status: 403 },
            );
          }
        }

        await oxigraphService.removeStore(worldId);
        if (authorized.account) {
          const timestamp = Date.now();
          const id = ulid(timestamp);
          await accountsService.meter({
            id,
            timestamp,
            accountId: authorized.account.id,
            endpoint: "DELETE /worlds/{worldId}",
            params: { worldId },
            statusCode: 204,
          });
        }

        // Remove from account's access control
        if (authorized.account) {
          try {
            await accountsService.removeWorldAccess(
              authorized.account.id,
              worldId,
            );
          } catch {
            // Ignore if already removed or account not found
          }
        }

        return new Response(null, { status: 204 });
      },
    );
};
