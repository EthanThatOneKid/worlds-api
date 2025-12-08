import type { MiddlewareHandler } from "hono";
import type { OxigraphService } from "./oxigraph-service.ts";

export interface OxigraphServiceEnv {
  Variables: {
    oxigraphService: OxigraphService;
  };
}

export function withOxigraphService(
  oxigraphService: OxigraphService,
): MiddlewareHandler<OxigraphServiceEnv> {
  return (ctx, next) => {
    ctx.set("oxigraphService", oxigraphService);
    return next();
  };
}
