import type {
  Account,
  Limit,
  UsageBucket,
  WorldMetadata,
} from "../core/types/mod.ts";
import { Worlds, type WorldsOptions } from "./worlds.ts";

/**
 * InternalWorlds is a TypeScript SDK for internal/owner-only operations
 * on the Worlds API.
 */
export class InternalWorlds extends Worlds {
  public constructor(options: WorldsOptions) {
    super(options);
  }

  /**
   * createAccount creates a new account in the Worlds API.
   */
  public async createAccount(account: Account): Promise<Account> {
    const url = new URL(`${this.options.baseUrl}/accounts`);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.options.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(account),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * getAccount retrieves an account from the Worlds API.
   */
  public async getAccount(accountId: string): Promise<Account | null> {
    const url = new URL(`${this.options.baseUrl}/accounts/${accountId}`);
    const response = await fetch(
      url,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.options.apiKey}`,
        },
      },
    );
    if (!response.ok) {
      // Return null if the account does not exist.
      if (response.status === 404) {
        return null;
      }

      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * updateAccount updates an existing account in the Worlds API.
   */
  public async updateAccount(account: Account): Promise<void> {
    const url = new URL(`${this.options.baseUrl}/accounts/${account.id}`);
    const response = await fetch(
      url,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${this.options.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(account),
      },
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  /**
   * removeAccount removes an account from the Worlds API.
   */
  public async removeAccount(accountId: string): Promise<void> {
    const url = new URL(`${this.options.baseUrl}/accounts/${accountId}`);
    const response = await fetch(
      url,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${this.options.apiKey}`,
        },
      },
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  /**
   * getWorldsByAccount retrieves the worlds owned by a specific account.
   * This is an admin-only operation.
   */
  public async getWorldsByAccount(
    accountId: string,
  ): Promise<WorldMetadata[]> {
    const url = new URL(
      `${this.options.baseUrl}/accounts/${accountId}/worlds`,
    );
    const response = await fetch(
      url,
      {
        headers: {
          Authorization: `Bearer ${this.options.apiKey}`,
        },
      },
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * listAccounts retrieves all accounts from the Worlds API.
   * This is an admin-only operation.
   */
  public async listAccounts(): Promise<Account[]> {
    const url = new URL(`${this.options.baseUrl}/accounts`);
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.options.apiKey}`,
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }
  /**
   * rotateAccountKey rotates the API key for an account.
   */
  public async rotateAccountKey(accountId: string): Promise<Account> {
    const url = new URL(
      `${this.options.baseUrl}/accounts/${accountId}/rotate`,
    );
    const response = await fetch(
      url,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.options.apiKey}`,
        },
      },
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }
  /**
   * getUsage retrieves the usage buckets for an account.
   */
  public async getUsage(accountId: string): Promise<UsageBucket[]> {
    const url = new URL(
      `${this.options.baseUrl}/accounts/${accountId}/usage`,
    );
    const response = await fetch(
      url,
      {
        headers: {
          Authorization: `Bearer ${this.options.apiKey}`,
        },
      },
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * getLimits retrieves the limits for a plan.
   */
  public async getLimits(plan: string): Promise<Limit | null> {
    const url = new URL(`${this.options.baseUrl}/limits/${plan}`);
    const response = await fetch(
      url,
      {
        headers: {
          Authorization: `Bearer ${this.options.apiKey}`,
        },
      },
    );
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * setLimits sets the limits for a plan.
   */
  public async setLimits(limit: Limit): Promise<void> {
    const url = new URL(`${this.options.baseUrl}/limits/${limit.plan}`);
    const response = await fetch(
      url,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${this.options.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(limit),
      },
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }
}
