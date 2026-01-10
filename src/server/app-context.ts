import type { WorldsKvdex } from "./db/kvdex.ts";

/**
 * AppContext is shared by every route.
 */
export interface AppContext {
  db: WorldsKvdex;
  kv: Deno.Kv;
  admin?: {
    apiKey: string;
  };
}
