import type { OxigraphService } from "#/oxigraph/oxigraph-service.ts";
import type { AccountsService } from "./accounts/accounts-service.ts";
import { DenoKvOxigraphService } from "./oxigraph/deno-kv/deno-kv-oxigraph-service.ts";
import { DenoKvAccountsService } from "./accounts/deno-kv/deno-kv-accounts-service.ts";

export interface AppContext {
  oxigraphService: OxigraphService;
  accountsService: AccountsService;
}

export function kvAppContext(kv: Deno.Kv): AppContext {
  return {
    oxigraphService: new DenoKvOxigraphService(kv),
    accountsService: new DenoKvAccountsService(kv),
  };
}
