import type { ApiKeysService } from "./api-keys-service.ts";

/**
 * DenoKvApiKeysService is the service for API keys.
 *
 * The environment variable `API_KEY` is used as a universal API key.
 */
export class DenoKvApiKeysService implements ApiKeysService {
  public constructor(
    private readonly kv: Deno.Kv,
    private readonly prefix: Deno.KvKey = ["api_keys"],
  ) {}

  public async add(key: string): Promise<void> {
    await this.kv.set([...this.prefix, key], true);
  }

  public async has(key: string): Promise<boolean> {
    if (key === Deno.env.get("API_KEY")) {
      return true;
    }

    const result = await this.kv.get<boolean>([...this.prefix, key]);
    return result.value === true;
  }

  public async remove(key: string): Promise<void> {
    await this.kv.delete([...this.prefix, key]);
  }
}
