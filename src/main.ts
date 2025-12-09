import { Router } from "@fartlabs/rt";
import { expandGlob } from "@std/fs";
import { toFileUrl } from "@std/path";
import { kvAppContext } from "#/app-context.ts";

const kv = await Deno.openKv(Deno.env.get("DENO_KV_PATH"));

const appContext = kvAppContext(kv);

const app = new Router();

for await (
  const entry of expandGlob("./src/v1/routes/**/route.ts")
) {
  const module = await import(toFileUrl(entry.path).href);
  if (typeof module.default === "function") {
    const subRouter = module.default(appContext);

    app.use(subRouter);
  }
}

export default {
  fetch: (request: Request) => app.fetch(request),
} satisfies Deno.ServeDefaultExport;
