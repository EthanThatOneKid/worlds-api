import { Router } from "@fartlabs/rt";
import { authorizeRequest } from "#/server/middleware/auth.ts";
import type { AppContext } from "#/server/app-context.ts";
import { LibsqlSearchStoreManager } from "#/server/search/libsql.ts";
import {
  createWorldParamsSchema,
  updateWorldParamsSchema,
} from "#/server/schemas.ts";
import { getPlanPolicy, getPolicy } from "#/server/rate-limit/policies.ts";
import { Parser, Store, Writer } from "n3";
import { TokenBucketRateLimiter } from "#/server/rate-limit/rate-limiter.ts";

const SERIALIZATIONS: Record<string, { contentType: string; format: string }> =
  {
    "turtle": { contentType: "text/turtle", format: "Turtle" },
    "n-quads": { contentType: "application/n-quads", format: "N-Quads" },
    "n-triples": { contentType: "application/n-triples", format: "N-Triples" },
    "n3": { contentType: "text/n3", format: "N3" },
  };

const DEFAULT_SERIALIZATION = SERIALIZATIONS["n-quads"];

export default (appContext: AppContext) => {
  return new Router()
    .get(
      "/v1/worlds/:world",
      async (ctx) => {
        const worldId = ctx.params?.pathname.groups.world;
        if (!worldId) {
          return new Response("World ID required", { status: 400 });
        }

        const authorized = await authorizeRequest(appContext, ctx.request);
        if (!authorized.account && !authorized.admin) {
          return new Response("Unauthorized", { status: 401 });
        }

        const result = await appContext.db.worlds.find(worldId);

        if (
          !result || result.value.deletedAt != null ||
          (result.value.accountId !== authorized.account?.id &&
            !authorized.admin)
        ) {
          return new Response("World not found", { status: 404 });
        }

        // TODO: Respond with different formats based on the relevant HTTP header.

        return Response.json({ ...result.value, id: worldId });
      },
    )
    .get(
      "/v1/worlds/:world/download",
      async (ctx) => {
        const worldId = ctx.params?.pathname.groups.world;
        if (!worldId) {
          return new Response("World ID required", { status: 400 });
        }

        const authorized = await authorizeRequest(appContext, ctx.request);
        if (!authorized.account && !authorized.admin) {
          return new Response("Unauthorized", { status: 401 });
        }

        const worldResult = await appContext.db.worlds.find(worldId);
        if (
          !worldResult || worldResult.value.deletedAt != null ||
          (worldResult.value.accountId !== authorized.account?.id &&
            !authorized.admin)
        ) {
          return new Response("World not found", { status: 404 });
        }

        // Apply rate limit
        const plan = authorized.account?.value.plan ?? "free";
        const policy = getPolicy(plan, "world_download");
        const rateLimiter = new TokenBucketRateLimiter(appContext.kv);
        const rateLimitResult = await rateLimiter.consume(
          `${authorized.account?.id || "admin"}:world_download`,
          1,
          policy,
        );

        if (!rateLimitResult.allowed) {
          return new Response("Rate limit exceeded", {
            status: 429,
            headers: {
              "X-RateLimit-Limit": policy.capacity.toString(),
              "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
              "X-RateLimit-Reset": rateLimitResult.reset.toString(),
            },
          });
        }

        const url = new URL(ctx.request.url);
        const formatParam = url.searchParams.get("format");
        const acceptHeader = ctx.request.headers.get("Accept");

        let serialization = DEFAULT_SERIALIZATION;
        if (formatParam && SERIALIZATIONS[formatParam]) {
          serialization = SERIALIZATIONS[formatParam];
        } else if (acceptHeader) {
          const match = Object.values(SERIALIZATIONS).find((s) =>
            acceptHeader.includes(s.contentType)
          );
          if (match) {
            serialization = match;
          }
        }

        const worldBlob = await appContext.db.worldBlobs.find(worldId);
        if (!worldBlob) {
          return new Response("World data not found", { status: 404 });
        }

        // worldBlob.value is a Uint8Array
        const worldString = new TextDecoder().decode(worldBlob.value);

        // If requested format is already N-Quads (our internal storage format), return as is
        if (serialization.format === "N-Quads") {
          return new Response(worldString, {
            headers: { "Content-Type": serialization.contentType },
          });
        }

        // Otherwise, re-serialize using n3
        try {
          const parser = new Parser({ format: "N-Quads" });
          const quads = parser.parse(worldString);
          const store = new Store();
          store.addQuads(quads);

          const writer = new Writer({ format: serialization.format });
          writer.addQuads(store.getQuads(null, null, null, null));
          const result = await new Promise<string>((resolve, reject) => {
            writer.end((error, result) => {
              if (error) reject(error);
              else resolve(result as string);
            });
          });

          return new Response(result, {
            headers: { "Content-Type": serialization.contentType },
          });
        } catch (error) {
          console.error("Serialization error:", error);
          return new Response("Failed to serialize world data", {
            status: 500,
          });
        }
      },
    )
    .put(
      "/v1/worlds/:world",
      async (ctx) => {
        const worldId = ctx.params?.pathname.groups.world;
        if (!worldId) {
          return new Response("World ID required", { status: 400 });
        }

        const authorized = await authorizeRequest(appContext, ctx.request);
        const worldResult = await appContext.db.worlds.find(worldId);
        if (
          !worldResult || worldResult.value.deletedAt != null ||
          (worldResult.value.accountId !== authorized.account?.id &&
            !authorized.admin)
        ) {
          return new Response("World not found", { status: 404 });
        }

        let body;
        try {
          body = await ctx.request.json();
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const parseResult = updateWorldParamsSchema.safeParse(body);
        if (!parseResult.success) {
          return Response.json(parseResult.error, { status: 400 });
        }
        const data = parseResult.data;

        const updatedAt = Date.now();
        const result = await appContext.db.worlds.update(worldId, {
          label: data.label ?? worldResult.value.label,
          description: data.description ?? worldResult.value.description,
          isPublic: data.isPublic ?? worldResult.value.isPublic,
          updatedAt,
        });
        if (!result.ok) {
          return Response.json({ error: "Failed to update world" }, {
            status: 500,
          });
        }

        return new Response(null, { status: 204 });
      },
    )
    .delete(
      "/v1/worlds/:world",
      async (ctx) => {
        const worldId = ctx.params?.pathname.groups.world;
        if (!worldId) {
          return new Response("World ID required", { status: 400 });
        }

        const authorized = await authorizeRequest(appContext, ctx.request);
        const worldResult = await appContext.db.worlds.find(worldId);
        if (
          !worldResult || worldResult.value.deletedAt != null ||
          (worldResult.value.accountId !== authorized.account?.id &&
            !authorized.admin)
        ) {
          return new Response("World not found", { status: 404 });
        }

        // Initialize search store to delete world's search data
        const searchStore = new LibsqlSearchStoreManager({
          client: appContext.libsqlClient,
          embeddings: appContext.embeddings,
        });
        await searchStore.createTablesIfNotExists();
        await searchStore.deleteWorld(worldResult.value.accountId, worldId);

        // Delete world blob and metadata sequentially (kvdex atomic limitation with serialized collections)
        await appContext.db.worldBlobs.delete(worldId);
        await appContext.db.worlds.delete(worldId);

        return new Response(null, { status: 204 });
      },
    )
    .get(
      "/v1/worlds",
      async (ctx) => {
        const authorized = await authorizeRequest(appContext, ctx.request);
        if (!authorized.account) {
          return new Response("Unauthorized", { status: 401 });
        }

        const url = new URL(ctx.request.url);
        const pageString = url.searchParams.get("page") ?? "1";
        const pageSizeString = url.searchParams.get("pageSize") ?? "20";
        const page = parseInt(pageString);
        const pageSize = parseInt(pageSizeString);
        const offset = (page - 1) * pageSize;
        const { result } = await appContext.db.worlds.findBySecondaryIndex(
          "accountId",
          authorized.account.id,
          {
            limit: pageSize,
            offset: offset,
          },
        );

        return Response.json(
          result.map(({ value, id }) => ({ ...value, id })),
        );
      },
    )
    .post(
      "/v1/worlds",
      async (ctx) => {
        const authorized = await authorizeRequest(appContext, ctx.request);
        if (!authorized.account) {
          return new Response("Unauthorized", { status: 401 });
        }

        let body;
        try {
          body = await ctx.request.json();
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const parseResult = createWorldParamsSchema.safeParse(body);
        if (!parseResult.success) {
          return Response.json(parseResult.error, { status: 400 });
        }
        const data = parseResult.data;
        const planPolicy = getPlanPolicy(authorized.account.value.plan ?? null);
        const { result: worlds } = await appContext.db.worlds
          .findBySecondaryIndex(
            "accountId",
            authorized.account.id,
          );
        const activeWorlds = worlds.filter((w) => w.value.deletedAt == null);
        if (activeWorlds.length >= planPolicy.worldLimits.maxWorlds) {
          return new Response("World limit reached", { status: 403 });
        }

        const now = Date.now();
        const world = {
          accountId: authorized.account!.id,
          label: data.label,
          description: data.description,
          createdAt: now,
          updatedAt: now,
          deletedAt: undefined,
          isPublic: data.isPublic,
        };
        const result = await appContext.db.worlds.add(world);

        if (!result.ok) {
          return Response.json({ error: "Failed to create world" }, {
            status: 500,
          });
        }

        return Response.json({ ...world, id: result.id }, { status: 201 });
      },
    );
};
