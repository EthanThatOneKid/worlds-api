import { Router } from "@fartlabs/rt";
import { sqliteAppContext } from "./app-context.ts";

const dbPath = Deno.env.get("SQLITE_DB_PATH") ?? "system.db";
const appContext = await sqliteAppContext(dbPath);

const app = new Router();

const routes = [
  "routes/v1/worlds/route.ts",
  "routes/v1/worlds/sparql/route.ts",
  "routes/v1/accounts/route.ts",
  "routes/v1/limits/route.ts",
];

for (const specifier of routes) {
  const module = await import(`./${specifier}`);
  if (!(typeof module.default === "function")) {
    throw new Error(`Route ${specifier} does not export a default function`);
  }

  const subRouter = module.default(appContext);
  app.use(subRouter);
}

export default {
  fetch: (request: Request) => app.fetch(request),
} satisfies Deno.ServeDefaultExport;
