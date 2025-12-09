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
  public async addApiKey(key: string): Promise<void> {
    const response = await fetch(`${this.options.baseUrl}/api-keys`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.options.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ key }),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, body: ${text}`);
    }
  }

  /**
   * removeApiKey removes an API key from the Worlds API.
   */
  public async removeApiKey(key: string): Promise<void> {
    const response = await fetch(`${this.options.baseUrl}/api-keys/${key}`, {
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
