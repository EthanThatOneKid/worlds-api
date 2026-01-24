import { Router } from "@fartlabs/rt";
import { ulid } from "@std/ulid";
import { authorizeRequest } from "#/server/middleware/auth.ts";
import type { AppContext } from "#/server/app-context.ts";
import { createInviteParamsSchema } from "#/server/schemas.ts";

export default (appContext: AppContext) =>
  new Router()
    .get(
      "/v1/invites",
      async (ctx) => {
        const authorized = await authorizeRequest(appContext, ctx.request);
        if (!authorized.account && !authorized.admin) {
          return new Response("Unauthorized", { status: 401 });
        }

        if (!authorized.admin) {
          return new Response("Forbidden: Admin access required", {
            status: 403,
          });
        }

        const url = new URL(ctx.request.url);
        const pageString = url.searchParams.get("page") ?? "1";
        const pageSizeString = url.searchParams.get("pageSize") ?? "20";
        const page = parseInt(pageString);
        const pageSize = parseInt(pageSizeString);
        const offset = (page - 1) * pageSize;
        const { result } = await appContext.db.invites.getMany({
          limit: pageSize,
          offset: offset,
        });

        return Response.json(
          result.map(({ value, id }) => ({ ...value, code: id })),
        );
      },
    )
    .post(
      "/v1/invites",
      async (ctx) => {
        const authorized = await authorizeRequest(appContext, ctx.request);
        if (!authorized.account && !authorized.admin) {
          return new Response("Unauthorized", { status: 401 });
        }

        if (!authorized.admin) {
          return new Response("Forbidden: Admin access required", {
            status: 403,
          });
        }

        let body = {};
        try {
          body = await ctx.request.json();
        } catch {
          // Empty body is allowed, default code will be generated
        }

        const parseResult = createInviteParamsSchema.safeParse(body);
        if (!parseResult.success) {
          return Response.json(parseResult.error, { status: 400 });
        }

        const code = parseResult.data.code ?? ulid();
        const now = Date.now();
        const invite = {
          code: code,
          createdAt: now,
          redeemedBy: null,
          redeemedAt: null,
        };

        try {
          const result = await appContext.db.invites.add(invite);
          if (!result.ok) {
            console.error("KV Add failed:", result);
            return new Response("Failed to create invite", { status: 500 });
          }
        } catch (e: unknown) {
          console.error("KV Add threw:", e);
          const message = e instanceof Error ? e.message : "Unknown error";
          return new Response("Failed to create invite: " + message, {
            status: 500,
          });
        }

        return Response.json(invite, { status: 201 });
      },
    )
    .get(
      "/v1/invites/:code",
      async (ctx) => {
        const authorized = await authorizeRequest(appContext, ctx.request);
        if (!authorized.account && !authorized.admin) {
          return new Response("Unauthorized", { status: 401 });
        }

        if (!authorized.admin) {
          return new Response("Forbidden: Admin access required", {
            status: 403,
          });
        }

        const code = ctx.params?.pathname.groups.code;
        if (!code) {
          return new Response("Invite code required", { status: 400 });
        }

        const result = await appContext.db.invites.find(code);
        if (!result) {
          return new Response("Invite not found", { status: 404 });
        }

        return Response.json({ ...result.value, code: code });
      },
    )
    .delete(
      "/v1/invites/:code",
      async (ctx) => {
        const authorized = await authorizeRequest(appContext, ctx.request);
        if (!authorized.account && !authorized.admin) {
          return new Response("Unauthorized", { status: 401 });
        }

        if (!authorized.admin) {
          return new Response("Forbidden: Admin access required", {
            status: 403,
          });
        }

        const code = ctx.params?.pathname.groups.code;
        if (!code) {
          return new Response("Invite code required", { status: 400 });
        }

        await appContext.db.invites.delete(code);
        return new Response(null, { status: 204 });
      },
    )
    .post(
      "/v1/invites/:code/redeem",
      async (ctx) => {
        const authorized = await authorizeRequest(appContext, ctx.request);
        if (!authorized.account && !authorized.admin) {
          return new Response("Unauthorized", { status: 401 });
        }

        // For redemption, we need an actual account (not just admin)
        if (!authorized.account) {
          return new Response("Account required for redemption", {
            status: 400,
          });
        }

        const code = ctx.params?.pathname.groups.code;
        if (!code) {
          return new Response("Invite code required", { status: 400 });
        }

        // Find the invite
        const inviteResult = await appContext.db.invites.find(code);
        if (!inviteResult) {
          return new Response("Invite not found", { status: 404 });
        }

        // Check if already redeemed
        if (inviteResult.value.redeemedBy) {
          return new Response("Invite already redeemed", { status: 410 });
        }

        // Check if user already has a plan
        const account = authorized.account.value;
        if (account.plan && account.plan !== "shadow") {
          return new Response("Account already has a plan", { status: 409 });
        }

        const now = Date.now();

        // Update the invite
        const inviteUpdateResult = await appContext.db.invites.update(code, {
          redeemedBy: authorized.account.id,
          redeemedAt: now,
        });
        if (!inviteUpdateResult.ok) {
          return new Response("Failed to redeem invite", { status: 500 });
        }

        // Update the account's plan to "free"
        const accountUpdateResult = await appContext.db.accounts.update(
          authorized.account.id,
          {
            plan: "free",
            updatedAt: now,
          },
        );
        if (!accountUpdateResult.ok) {
          return new Response("Failed to update account plan", { status: 500 });
        }

        return Response.json({
          message: "Invite redeemed successfully",
          plan: "free",
        });
      },
    );
