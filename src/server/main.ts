import { Router } from "@fartlabs/rt";
import type { AppContext } from "./app-context.ts";
import { worldsKvdex } from "./db/kvdex.ts";

const apiKey = Deno.env.get("ADMIN_API_KEY");
if (!apiKey) {
  throw new Error("ADMIN_API_KEY is not set");
}

const kv = await Deno.openKv(Deno.env.get("DENO_KV_PATH"));
const db = worldsKvdex(kv);

const appContext: AppContext = {
  db,
  kv,
  admin: { apiKey },
};

const app = new Router();

const routes = [
  "routes/v1/accounts/route.ts",
  "routes/v1/plans/route.ts",
  "routes/v1/worlds/route.ts",
  "routes/v1/worlds/sparql/route.ts",
  "routes/v1/worlds/usage/route.ts",
];

for (const specifier of routes) {
  const module = await import(`./${specifier}`);
  app.use(module.default(appContext));
}

export default {
  fetch: (request: Request) => app.fetch(request),
} satisfies Deno.ServeDefaultExport;
