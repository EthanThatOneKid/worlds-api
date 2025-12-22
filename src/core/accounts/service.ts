import type { Account } from "#/core/types/mod.ts";
export * from "#/core/types/mod.ts";

/**
 * AccountsService manages access control and authorization.
 */
export interface AccountsService {
  /**
   * set sets an account.
   */
  set(account: Account): Promise<void>;

  /**
   * get gets an account.
   */
  get(id: string): Promise<Account | null>;

  /**
   * getByApiKey gets an account by its API key.
   */
  getByApiKey(apiKey: string): Promise<Account | null>;

  /**
   * remove removes an account.
   */
  remove(id: string): Promise<void>;

  /**
   * listAccounts retrieves all accounts.
   */
  listAccounts(): Promise<Account[]>;

  /**
   * addWorldAccess adds a world to an account's access control list atomically.
   */
  addWorldAccess(accountId: string, worldId: string): Promise<void>;

  /**
   * removeWorldAccess removes a world from an account's access control list atomically.
   */
  removeWorldAccess(accountId: string, worldId: string): Promise<void>;
}
