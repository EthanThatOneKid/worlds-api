import { Router } from "@fartlabs/rt";
import type { AppContext } from "#/server/app-context.ts";
import { authorizeRequest } from "#/core/accounts/authorize.ts";
import { plans } from "#/core/accounts/plans.ts";
import type { Limit } from "#/core/types/usage.ts";

export default ({ limitsService, accountsService }: AppContext) => {
  return new Router()
    .get(
      "/v1/limits/:plan",
      async (ctx) => {
        const authorized = await authorizeRequest(accountsService, ctx.request);
        if (!authorized) {
          return new Response("Unauthorized", { status: 401 });
        }

        const plan = ctx.params?.pathname.groups.plan;
        if (!plan) {
          return new Response("Plan required", { status: 400 });
        }

        const limit = await limitsService.getLimits(plan);
        if (limit) {
          return Response.json(limit);
        }

        // Fallback to hardcoded plans if not in DB
        // Check if plan exists in plans object (needs type assertion or check)
        // For strictness, if not in DB and not a known plan, 404.
        // But we want to seed defaults.
        const defaultPlan = plans[plan as keyof typeof plans];
        if (defaultPlan) {
          // Construct a full Limit object from partial plans info + defaults
          const defaultLimit: Limit = {
            plan: plan,
            quotaRequestsPerMin: 60, // Default
            quotaStorageBytes: 104857600, // Default 100MB
            allowReasoning: false, // Default
            ...defaultPlan, // Add plan-specific properties (e.g. worlds count, though not in Limit interface currently)
          };
          // Fix: plans.ts has worlds property, Limit doesn't have worlds property explicitly in my memory of usage.ts??
          // Let's re-read usage.ts in a sec. Wait.
          // Limit interface: plan, quotaRequestsPerMin, quotaStorageBytes, allowReasoning.
          // plans.ts: { worlds: number }
          // There is a mismatch between Limit interface and plans.ts

          // Plan: The Limit interface in SDK usage.ts is what we return.
          // The plans.ts defines "worlds" limit.
          // We should probably merge these concepts or update Limit interface.
          // The Design says: quota_requests_per_min, quota_storage_bytes, allow_reasoning.
          // It does NOT mention 'worlds' count in kb_limits table.
          // But plans.ts has 'worlds' count.
          // I will return what matches Limit interface.
          return Response.json(defaultLimit);
        }

        return new Response("Plan not found", { status: 404 });
      },
    )
    .put(
      "/v1/limits/:plan",
      async (ctx) => {
        const authorized = await authorizeRequest(accountsService, ctx.request);
        if (!authorized) {
          return new Response("Unauthorized", { status: 401 });
        }
        if (!authorized.admin) {
          return new Response("Forbidden: Admin access required", {
            status: 403,
          });
        }

        const plan = ctx.params?.pathname.groups.plan;
        if (!plan) {
          return new Response("Plan required", { status: 400 });
        }

        let body: Limit;
        try {
          body = await ctx.request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }

        if (body.plan !== plan) {
          return Response.json(
            { error: "Plan mismatch" },
            { status: 400 },
          );
        }

        await limitsService.setLimits(body);
        return new Response(null, { status: 204 });
      },
    );
};
