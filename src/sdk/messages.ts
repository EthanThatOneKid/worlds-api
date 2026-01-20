import type { WorldsOptions } from "./types.ts";
import type { CreateMessageParams, MessageRecord } from "./types.ts";

/**
 * Messages is a TypeScript SDK for the Messages API.
 */
export class Messages {
  private readonly fetch: typeof fetch;

  public constructor(
    public readonly options: WorldsOptions,
  ) {
    this.fetch = options.fetch ?? globalThis.fetch;
  }

  /**
   * list paginates messages in a conversation.
   */
  public async list(
    worldId: string,
    conversationId: string,
    options?: {
      limit?: number;
      offset?: number;
      accountId?: string;
    },
  ): Promise<MessageRecord[]> {
    const url = new URL(
      `${this.options.baseUrl}/worlds/${worldId}/conversations/${conversationId}/messages`,
    );
    if (options?.accountId) {
      url.searchParams.set("account", options.accountId);
    }
    if (options?.limit) {
      url.searchParams.set("limit", options.limit.toString());
    }
    if (options?.offset) {
      url.searchParams.set("offset", options.offset.toString());
    }

    const response = await this.fetch(url, {
      headers: {
        Authorization: `Bearer ${this.options.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to list messages: ${response.status} ${response.statusText}`,
      );
    }

    return await response.json();
  }

  /**
   * create creates a message in a conversation.
   */
  public async create(
    worldId: string,
    conversationId: string,
    data: CreateMessageParams,
    options?: { accountId?: string },
  ): Promise<MessageRecord> {
    const url = new URL(
      `${this.options.baseUrl}/worlds/${worldId}/conversations/${conversationId}/messages`,
    );
    if (options?.accountId) {
      url.searchParams.set("account", options.accountId);
    }

    const response = await this.fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.options.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to create message: ${response.status} ${response.statusText}`,
      );
    }

    return await response.json();
  }
}
