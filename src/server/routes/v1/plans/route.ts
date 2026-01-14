import { Router } from "@fartlabs/rt";
import { authorizeRequest } from "#/server/middleware/auth.ts";
import { z } from "zod";
import type { AppContext } from "#/server/app-context.ts";

export default (appContext: AppContext) =>
  new Router()
    .get(
      "/v1/plans",
      async (ctx) => {
        const authorized = await authorizeRequest(appContext, ctx.request);
        if (!authorized.account && !authorized.admin) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { result } = await appContext.db.plans.getMany();
        return Response.json(
          result.map(({ value, id }) => ({ ...value, id })),
        );
      },
    )
    .get(
      "/v1/plans/:plan",
      async (ctx) => {
        const authorized = await authorizeRequest(appContext, ctx.request);
        if (!authorized.account && !authorized.admin) {
          return new Response("Unauthorized", { status: 401 });
        }

        const planTypeString = ctx.params?.pathname.groups.plan;
        if (!planTypeString) {
          return new Response("Plan required", { status: 400 });
        }
        const parsed = z.string().safeParse(planTypeString);
        if (!parsed.success) {
          return new Response("Invalid plan type", { status: 400 });
        }
        const planType = parsed.data;

        const result = await appContext.db.plans.find(planType);
        if (!result) {
          return new Response("Plan not found", { status: 404 });
        }

        return Response.json({ ...result.value, id: planType });
      },
    )
    .post(
      "/v1/plans",
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

        const body = await ctx.request.json();
        const parsed = z.string().safeParse(body.name);
        if (!parsed.success) {
          return new Response("Invalid plan type", { status: 400 });
        }

        const name = parsed.data;
        const plan = {
          name,
          quotaRequestsPerMin: body.quotaRequestsPerMin,
          quotaStorageBytes: body.quotaStorageBytes,
        };
        const result = await appContext.db.plans.add(plan);

        if (!result.ok) {
          return new Response("Failed to create plan", { status: 500 });
        }

        return Response.json({ ...plan, id: name }, { status: 201 });
      },
    )
    .put(
      "/v1/plans/:plan",
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

        const planTypeString = ctx.params?.pathname.groups.plan;
        if (!planTypeString) {
          return new Response("Plan required", { status: 400 });
        }
        const parsed = z.string().safeParse(planTypeString);
        if (!parsed.success) {
          return new Response("Invalid plan type", { status: 400 });
        }
        const planType = parsed.data;

        const body = await ctx.request.json();

        // Validate that name in body matches URL parameter
        if (body.name !== planType) {
          return new Response("Plan name mismatch", { status: 400 });
        }

        // Check if plan exists, if not create it
        const existingPlan = await appContext.db.plans.find(planType);
        let result;
        if (!existingPlan) {
          result = await appContext.db.plans.add({
            name: body.name,
            quotaRequestsPerMin: body.quotaRequestsPerMin,
            quotaStorageBytes: body.quotaStorageBytes,
          });
        } else {
          result = await appContext.db.plans.update(planType, {
            name: body.name,
            quotaRequestsPerMin: body.quotaRequestsPerMin,
            quotaStorageBytes: body.quotaStorageBytes,
          });
        }

        if (!result.ok) {
          console.error("Plan update failed:", result);
          return new Response("Failed to update plan", { status: 500 });
        }

        return new Response(null, { status: 204 });
      },
    )
    .delete(
      "/v1/plans/:plan",
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

        const planTypeString = ctx.params?.pathname.groups.plan;
        if (!planTypeString) {
          return new Response("Plan required", { status: 400 });
        }
        const parsed = z.string().safeParse(planTypeString);
        if (!parsed.success) {
          return new Response("Invalid plan type", { status: 400 });
        }
        const planType = parsed.data;

        await appContext.db.plans.delete(planType);
        return new Response(null, { status: 204 });
      },
    );
