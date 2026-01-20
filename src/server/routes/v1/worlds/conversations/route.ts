import { Router } from "@fartlabs/rt";
import { authorizeRequest } from "#/server/middleware/auth.ts";
import type { AppContext } from "#/server/app-context.ts";
import type { Conversation, Message } from "#/server/db/kvdex.ts";

export default (appContext: AppContext) => {
  return new Router()
    .get(
      "/v1/worlds/:world/conversations",
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
          !worldResult || worldResult.value.deletedAt !== null ||
          (worldResult.value.accountId !== authorized.account?.id &&
            !authorized.admin && !worldResult.value.isPublic)
        ) {
          return new Response("World not found", { status: 404 });
        }

        const url = new URL(ctx.request.url);
        const limit = parseInt(url.searchParams.get("limit") ?? "20");
        const offset = parseInt(url.searchParams.get("offset") ?? "0");

        const { result } = await appContext.db.conversations
          .findBySecondaryIndex(
            "worldId",
            worldId,
          );

        const sorted = result.sort((
          a: { value: Conversation },
          b: { value: Conversation },
        ) => b.value.updatedAt - a.value.updatedAt);
        const paginated = sorted.slice(offset, offset + limit);

        return Response.json(
          paginated.map((
            { value, id }: { value: Conversation; id: string },
          ) => ({
            ...value,
            id,
          })),
        );
      },
    )
    .post(
      "/v1/worlds/:world/conversations",
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
          !worldResult || worldResult.value.deletedAt !== null ||
          (worldResult.value.accountId !== authorized.account?.id &&
            !authorized.admin)
        ) {
          return new Response("World not found", { status: 404 });
        }

        const body = await ctx.request.json();
        const now = Date.now();
        const conversation: Conversation = {
          id: crypto.randomUUID(),
          worldId,
          createdAt: now,
          updatedAt: now,
          metadata: body.metadata,
        };

        const result = await appContext.db.conversations.add(conversation);
        if (!result.ok) {
          return new Response("Failed to create conversation", { status: 500 });
        }

        return Response.json({ ...conversation, id: result.id }, {
          status: 201,
        });
      },
    )
    .get(
      "/v1/worlds/:world/conversations/:conversation",
      async (ctx) => {
        const worldId = ctx.params?.pathname.groups.world;
        const conversationId = ctx.params?.pathname.groups.conversation;
        if (!worldId || !conversationId) {
          return new Response("World ID and Conversation ID required", {
            status: 400,
          });
        }

        const authorized = await authorizeRequest(appContext, ctx.request);
        if (!authorized.account && !authorized.admin) {
          return new Response("Unauthorized", { status: 401 });
        }

        const worldResult = await appContext.db.worlds.find(worldId);
        if (
          !worldResult || worldResult.value.deletedAt !== null ||
          (worldResult.value.accountId !== authorized.account?.id &&
            !authorized.admin && !worldResult.value.isPublic)
        ) {
          return new Response("World not found", { status: 404 });
        }

        const conversationResult = await appContext.db.conversations.find(
          conversationId,
        );
        if (
          !conversationResult || conversationResult.value.worldId !== worldId
        ) {
          return new Response("Conversation not found", { status: 404 });
        }

        return Response.json({
          ...conversationResult.value,
          id: conversationResult.id,
        });
      },
    )
    .put(
      "/v1/worlds/:world/conversations/:conversation",
      async (ctx) => {
        const worldId = ctx.params?.pathname.groups.world;
        const conversationId = ctx.params?.pathname.groups.conversation;
        if (!worldId || !conversationId) {
          return new Response("World ID and Conversation ID required", {
            status: 400,
          });
        }

        const authorized = await authorizeRequest(appContext, ctx.request);
        if (!authorized.account && !authorized.admin) {
          return new Response("Unauthorized", { status: 401 });
        }

        const worldResult = await appContext.db.worlds.find(worldId);
        if (
          !worldResult || worldResult.value.deletedAt !== null ||
          (worldResult.value.accountId !== authorized.account?.id &&
            !authorized.admin)
        ) {
          return new Response("World not found", { status: 404 });
        }

        const conversationResult = await appContext.db.conversations.find(
          conversationId,
        );
        if (
          !conversationResult || conversationResult.value.worldId !== worldId
        ) {
          return new Response("Conversation not found", { status: 404 });
        }

        const body = await ctx.request.json();
        const updatedConversation: Conversation = {
          ...conversationResult.value,
          metadata: body.metadata ?? conversationResult.value.metadata,
          updatedAt: Date.now(),
        };

        const result = await appContext.db.conversations.set(
          conversationId,
          updatedConversation,
        );
        if (!result.ok) {
          return new Response("Failed to update conversation", { status: 500 });
        }

        return Response.json({ ...updatedConversation, id: conversationId });
      },
    )
    .delete(
      "/v1/worlds/:world/conversations/:conversation",
      async (ctx) => {
        const worldId = ctx.params?.pathname.groups.world;
        const conversationId = ctx.params?.pathname.groups.conversation;
        if (!worldId || !conversationId) {
          return new Response("World ID and Conversation ID required", {
            status: 400,
          });
        }

        const authorized = await authorizeRequest(appContext, ctx.request);
        if (!authorized.account && !authorized.admin) {
          return new Response("Unauthorized", { status: 401 });
        }

        const worldResult = await appContext.db.worlds.find(worldId);
        if (
          !worldResult || worldResult.value.deletedAt !== null ||
          (worldResult.value.accountId !== authorized.account?.id &&
            !authorized.admin)
        ) {
          return new Response("World not found", { status: 404 });
        }

        const conversationResult = await appContext.db.conversations.find(
          conversationId,
        );
        if (
          !conversationResult || conversationResult.value.worldId !== worldId
        ) {
          return new Response("Conversation not found", { status: 404 });
        }

        await appContext.db.conversations.delete(conversationId);
        // Also delete messages
        const { result: messages } = await appContext.db.messages
          .findBySecondaryIndex("conversationId", conversationId);
        for (const message of messages) {
          await appContext.db.messages.delete(message.id);
        }

        return new Response(null, { status: 204 });
      },
    )
    .get(
      "/v1/worlds/:world/conversations/:conversation/messages",
      async (ctx) => {
        const worldId = ctx.params?.pathname.groups.world;
        const conversationId = ctx.params?.pathname.groups.conversation;
        if (!worldId || !conversationId) {
          return new Response("World ID and Conversation ID required", {
            status: 400,
          });
        }

        const authorized = await authorizeRequest(appContext, ctx.request);
        if (!authorized.account && !authorized.admin) {
          return new Response("Unauthorized", { status: 401 });
        }

        const worldResult = await appContext.db.worlds.find(worldId);
        if (
          !worldResult || worldResult.value.deletedAt !== null ||
          (worldResult.value.accountId !== authorized.account?.id &&
            !authorized.admin && !worldResult.value.isPublic)
        ) {
          return new Response("World not found", { status: 404 });
        }

        const conversationResult = await appContext.db.conversations.find(
          conversationId,
        );
        if (
          !conversationResult || conversationResult.value.worldId !== worldId
        ) {
          return new Response("Conversation not found", { status: 404 });
        }

        const url = new URL(ctx.request.url);
        const limit = parseInt(url.searchParams.get("limit") ?? "20");
        const offset = parseInt(url.searchParams.get("offset") ?? "0");

        const { result } = await appContext.db.messages.findBySecondaryIndex(
          "conversationId",
          conversationId,
        );

        const sorted = result.sort((
          a: { value: Message },
          b: { value: Message },
        ) => a.value.createdAt - b.value.createdAt);
        const paginated = sorted.slice(offset, offset + limit);

        return Response.json(
          paginated.map(({ value, id }: { value: Message; id: string }) => ({
            ...value,
            id,
          })),
        );
      },
    )
    .post(
      "/v1/worlds/:world/conversations/:conversation/messages",
      async (ctx) => {
        const worldId = ctx.params?.pathname.groups.world;
        const conversationId = ctx.params?.pathname.groups.conversation;
        if (!worldId || !conversationId) {
          return new Response("World ID and Conversation ID required", {
            status: 400,
          });
        }

        const authorized = await authorizeRequest(appContext, ctx.request);
        if (!authorized.account && !authorized.admin) {
          return new Response("Unauthorized", { status: 401 });
        }

        const worldResult = await appContext.db.worlds.find(worldId);
        if (
          !worldResult || worldResult.value.deletedAt !== null ||
          (worldResult.value.accountId !== authorized.account?.id &&
            !authorized.admin)
        ) {
          return new Response("World not found", { status: 404 });
        }

        const conversationResult = await appContext.db.conversations.find(
          conversationId,
        );
        if (
          !conversationResult || conversationResult.value.worldId !== worldId
        ) {
          return new Response("Conversation not found", { status: 404 });
        }

        const body = await ctx.request.json();
        const now = Date.now();
        const message: Message = {
          id: crypto.randomUUID(),
          worldId,
          conversationId,
          content: body.content,
          createdAt: now,
        };

        const result = await appContext.db.messages.add(message);
        if (!result.ok) {
          return new Response("Failed to create message", { status: 500 });
        }

        // Update conversation updated at
        await appContext.db.conversations.update(conversationId, {
          updatedAt: now,
        });

        return Response.json({ ...message, id: result.id }, { status: 201 });
      },
    );
};
