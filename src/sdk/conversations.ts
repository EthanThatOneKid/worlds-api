import type { WorldsOptions } from "./types.ts";
import type {
  ConversationRecord,
  CreateConversationParams,
  UpdateConversationParams,
} from "./types.ts";

/**
 * Conversations is a TypeScript SDK for the Conversations API.
 */
export class Conversations {
  private readonly fetch: typeof fetch;

  public constructor(
    public readonly options: WorldsOptions,
  ) {
    this.fetch = options.fetch ?? globalThis.fetch;
  }

  /**
   * list paginates conversations in a world.
   */
  public async list(
    worldId: string,
    options?: {
      limit?: number;
      offset?: number;
      accountId?: string;
    },
  ): Promise<ConversationRecord[]> {
    const url = new URL(
      `${this.options.baseUrl}/worlds/${worldId}/conversations`,
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
        `Failed to list conversations: ${response.status} ${response.statusText}`,
      );
    }

    return await response.json();
  }

  /**
   * create creates a conversation in a world.
   */
  public async create(
    worldId: string,
    data: CreateConversationParams,
    options?: { accountId?: string },
  ): Promise<ConversationRecord> {
    const url = new URL(
      `${this.options.baseUrl}/worlds/${worldId}/conversations`,
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
        `Failed to create conversation: ${response.status} ${response.statusText}`,
      );
    }

    return await response.json();
  }

  /**
   * get gets a conversation from a world.
   */
  public async get(
    worldId: string,
    conversationId: string,
    options?: { accountId?: string },
  ): Promise<ConversationRecord | null> {
    const url = new URL(
      `${this.options.baseUrl}/worlds/${worldId}/conversations/${conversationId}`,
    );
    if (options?.accountId) {
      url.searchParams.set("account", options.accountId);
    }

    const response = await this.fetch(url, {
      headers: {
        Authorization: `Bearer ${this.options.apiKey}`,
      },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(
        `Failed to get conversation: ${response.status} ${response.statusText}`,
      );
    }

    return await response.json();
  }

  /**
   * update updates a conversation in a world.
   */
  public async update(
    worldId: string,
    conversationId: string,
    data: UpdateConversationParams,
    options?: { accountId?: string },
  ): Promise<ConversationRecord> {
    const url = new URL(
      `${this.options.baseUrl}/worlds/${worldId}/conversations/${conversationId}`,
    );
    if (options?.accountId) {
      url.searchParams.set("account", options.accountId);
    }

    const response = await this.fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${this.options.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to update conversation: ${response.status} ${response.statusText}`,
      );
    }

    return await response.json();
  }

  /**
   * delete deletes a conversation from a world.
   */
  public async delete(
    worldId: string,
    conversationId: string,
    options?: { accountId?: string },
  ): Promise<void> {
    const url = new URL(
      `${this.options.baseUrl}/worlds/${worldId}/conversations/${conversationId}`,
    );
    if (options?.accountId) {
      url.searchParams.set("account", options.accountId);
    }

    const response = await this.fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${this.options.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to delete conversation: ${response.status} ${response.statusText}`,
      );
    }
  }
}
