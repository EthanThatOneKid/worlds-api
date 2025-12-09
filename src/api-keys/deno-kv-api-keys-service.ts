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

  /**
   * add adds a new API key to the store.
   */
  public async add(key: string, storeId: string): Promise<void> {
    await this.kv.set([...this.prefix, key], storeId);
  }

  /**
   * get returns the associated store ID for the given API key.
   */
  public async get(key: string): Promise<string | null> {
    const result = await this.kv.get<string>([...this.prefix, key]);
    return result.value;
  }

  /**
   * remove removes the API key from the store.
   */
  public async remove(key: string): Promise<void> {
    await this.kv.delete([...this.prefix, key]);
  }
}
