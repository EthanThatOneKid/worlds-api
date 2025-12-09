/**
 * InternalWorldsApiSdk is a TypeScript SDK for internal/owner-only operations
 * on the Worlds API.
 */
export class InternalWorldsApiSdk {
  public constructor(
    public readonly options: {
      baseUrl: string;
      apiKey: string;
    },
  ) {}

  /**
   * addApiKey adds a new API key to the Worlds API.
   */
  public async addApiKey(apiKey: string, storeId: string): Promise<void> {
    const response = await fetch(`${this.options.baseUrl}/api-keys`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.options.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ apiKey, storeId }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  /**
   * removeApiKey removes an API key from the Worlds API.
   */
  public async removeApiKey(apiKey: string): Promise<void> {
    const response = await fetch(`${this.options.baseUrl}/api-keys/${apiKey}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${this.options.apiKey}`,
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }
}
