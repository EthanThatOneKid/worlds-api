/**
 * ApiKeysService is the service for API keys.
 */
export interface ApiKeysService {
  add(key: string): Promise<void>;
  has(key: string): Promise<boolean>;
  remove(key: string): Promise<void>;
}
