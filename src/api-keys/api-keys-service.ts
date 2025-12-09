/**
 * ApiKeysService is the service for API keys.
 */
export interface ApiKeysService {
  add(key: string, storeId: string): Promise<void>;
  get(key: string): Promise<string | null>;
  remove(key: string): Promise<void>;
}
