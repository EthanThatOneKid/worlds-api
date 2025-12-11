import { Router } from "@fartlabs/rt";
import type { AppContext } from "#/app-context.ts";
import type { Account } from "#/accounts/accounts-service.ts";
import { authorizeRequest } from "#/accounts/authorize.ts";

export default ({ accountsService }: AppContext) => {
  return new Router()
    .get("/v1/accounts", async (ctx) => {
      const authorized = await authorizeRequest(accountsService, ctx.request);
      if (!authorized?.admin) {
        return new Response("Unauthorized", { status: 401 });
      }

      const accounts = await accountsService.listAccounts();
      return Response.json(accounts);
    })
    .post("/v1/accounts", async (ctx) => {
      const authorized = await authorizeRequest(accountsService, ctx.request);
      if (!authorized?.admin) {
        return new Response("Unauthorized", { status: 401 });
      }

      // Parse request body
      let account: Account;
      try {
        account = await ctx.request.json();
      } catch {
        return Response.json({ error: "Invalid JSON" }, { status: 400 });
      }

      // Validate required fields
      if (
        !account.id || !account.description || !account.plan ||
        !account.accessControl
      ) {
        return Response.json(
          {
            error:
              "Missing required fields: id, description, plan, accessControl",
          },
          { status: 400 },
        );
      }

      // Create account
      await accountsService.set(account);
      return Response.json(account, { status: 201 });
    })
    .get("/v1/accounts/:accountId", async (ctx) => {
      const authorized = await authorizeRequest(accountsService, ctx.request);
      if (!authorized?.admin) {
        return new Response("Unauthorized", { status: 401 });
      }

      const accountId = ctx.params?.pathname.groups.accountId;
      if (!accountId) {
        return new Response("Account ID required", { status: 400 });
      }

      const account = await accountsService.get(accountId);
      if (!account) {
        return new Response("Account not found", { status: 404 });
      }

      return Response.json(account);
    })
    .put("/v1/accounts/:accountId", async (ctx) => {
      const authorized = await authorizeRequest(accountsService, ctx.request);
      if (!authorized?.admin) {
        return new Response("Unauthorized", { status: 401 });
      }

      const accountId = ctx.params?.pathname.groups.accountId;
      if (!accountId) {
        return new Response("Account ID required", { status: 400 });
      }

      // Parse request body
      let account: Account;
      try {
        account = await ctx.request.json();
      } catch {
        return Response.json({ error: "Invalid JSON" }, { status: 400 });
      }

      // Ensure ID matches
      if (account.id !== accountId) {
        return Response.json(
          { error: "Account ID mismatch" },
          { status: 400 },
        );
      }

      // Update account
      await accountsService.set(account);
      return new Response(null, { status: 204 });
    })
    .delete("/v1/accounts/:accountId", async (ctx) => {
      const authorized = await authorizeRequest(accountsService, ctx.request);
      if (!authorized?.admin) {
        return new Response("Unauthorized", { status: 401 });
      }

      const accountId = ctx.params?.pathname.groups.accountId;
      if (!accountId) {
        return new Response("Account ID required", { status: 400 });
      }

      await accountsService.remove(accountId);
      return new Response(null, { status: 204 });
    });
};
