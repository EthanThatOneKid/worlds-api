import { WorldsApiSdk } from "./worlds-api-sdk.ts";
import type { Account } from "#/accounts/accounts-service.ts";

/**
 * InternalWorldsApiSdk is a TypeScript SDK for internal/owner-only operations
 * on the Worlds API.
 */
export class InternalWorldsApiSdk extends WorldsApiSdk {
  public constructor(options: WorldsApiSdk["options"]) {
    super(options);
  }

  /**
   * createAccount creates a new account in the Worlds API.
   */
  public async createAccount(account: Account): Promise<Account> {
    const response = await fetch(`${this.options.baseUrl}/accounts`, {
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
  public async getAccount(accountId: string): Promise<Account> {
    const response = await fetch(
      `${this.options.baseUrl}/accounts/${accountId}`,
      {
        method: "GET",
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
   * updateAccount updates an existing account in the Worlds API.
   */
  public async updateAccount(account: Account): Promise<void> {
    const response = await fetch(
      `${this.options.baseUrl}/accounts/${account.id}`,
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
   * deleteAccount removes an account from the Worlds API.
   */
  public async deleteAccount(accountId: string): Promise<void> {
    const response = await fetch(
      `${this.options.baseUrl}/accounts/${accountId}`,
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
}
