import type {
  CreateWorldParams,
  SearchResult,
  UpdateWorldParams,
  UsageBucketRecord,
  WorldRecord,
  WorldsOptions,
} from "./types.ts";

/**
 * Worlds is a TypeScript SDK for the Worlds API.
 */
export class Worlds {
  private readonly fetch: typeof fetch;

  public constructor(
    public readonly options: WorldsOptions,
  ) {
    this.fetch = options.fetch ?? globalThis.fetch;
  }

  /**
   * list paginates all worlds from the Worlds API.
   */
  public async list(
    page = 1,
    pageSize = 20,
    options?: { accountId?: string },
  ): Promise<WorldRecord[]> {
    const url = new URL(`${this.options.baseUrl}/worlds`);
    if (options?.accountId) {
      url.searchParams.set("account", options.accountId);
    }

    url.searchParams.set("page", page.toString());
    url.searchParams.set("pageSize", pageSize.toString());
    const response = await this.fetch(url, {
      headers: {
        Authorization: `Bearer ${this.options.apiKey}`,
      },
    });
    if (!response.ok) {
      throw new Error(
        `Failed to list worlds: ${response.status} ${response.statusText}`,
      );
    }

    return await response.json();
  }

  /**
   * get gets a world from the Worlds API.
   */
  public async get(
    worldId: string,
    options?: { accountId?: string },
  ): Promise<WorldRecord | null> {
    const url = new URL(`${this.options.baseUrl}/worlds/${worldId}`);
    if (options?.accountId) {
      url.searchParams.set("account", options.accountId);
    }

    const response = await this.fetch(
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
      throw new Error(
        `Failed to get world: ${response.status} ${response.statusText}`,
      );
    }

    return await response.json();
  }

  /**
   * create creates a world in the Worlds API.
   */
  public async create(
    data: CreateWorldParams,
    options?: { accountId?: string },
  ): Promise<WorldRecord> {
    const url = new URL(`${this.options.baseUrl}/worlds`);
    if (options?.accountId) {
      url.searchParams.set("account", options.accountId);
    }

    const response = await this.fetch(
      url,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.options.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      },
    );
    if (!response.ok) {
      throw new Error(
        `Failed to create world: ${response.status} ${response.statusText}`,
      );
    }

    return await response.json();
  }

  /**
   * update updates a world in the Worlds API.
   */
  public async update(
    worldId: string,
    data: UpdateWorldParams,
    options?: { accountId?: string },
  ): Promise<void> {
    const url = new URL(`${this.options.baseUrl}/worlds/${worldId}`);
    if (options?.accountId) {
      url.searchParams.set("account", options.accountId);
    }

    const response = await this.fetch(
      url,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${this.options.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      },
    );
    if (!response.ok) {
      throw new Error(
        `Failed to update world: ${response.status} ${response.statusText}`,
      );
    }
  }

  /**
   * remove removes a world from the Worlds API.
   */
  public async remove(
    worldId: string,
    options?: { accountId?: string },
  ): Promise<void> {
    const url = new URL(`${this.options.baseUrl}/worlds/${worldId}`);
    if (options?.accountId) {
      url.searchParams.set("account", options.accountId);
    }

    const response = await this.fetch(
      url,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${this.options.apiKey}`,
        },
      },
    );
    if (!response.ok) {
      throw new Error(
        `Failed to remove world: ${response.status} ${response.statusText}`,
      );
    }
  }

  /**
   * sparqlQuery executes a SPARQL query against a world
   * in the Worlds API.
   *
   * @see https://www.w3.org/TR/sparql11-query/
   */
  public async sparqlQuery(
    worldId: string,
    query: string,
    options?: { accountId?: string },
  ): Promise<unknown> {
    const url = new URL(
      `${this.options.baseUrl}/worlds/${worldId}/sparql`,
    );
    if (options?.accountId) {
      url.searchParams.set("account", options.accountId);
    }

    const response = await this.fetch(
      url,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.options.apiKey}`,
          "Content-Type": "application/sparql-query",
          "Accept": "application/sparql-results+json",
        },
        body: query,
      },
    );
    if (!response.ok) {
      throw new Error(
        `Failed to execute SPARQL query: ${response.status} ${response.statusText}`,
      );
    }

    const json = await response.json();
    return json;
  }

  /**
   * sparqlUpdate executes a SPARQL update against a world
   * in the Worlds API.
   *
   * @see https://www.w3.org/TR/sparql11-update/
   */
  public async sparqlUpdate(
    worldId: string,
    update: string,
    options?: { accountId?: string },
  ): Promise<void> {
    const url = new URL(
      `${this.options.baseUrl}/worlds/${worldId}/sparql`,
    );
    if (options?.accountId) {
      url.searchParams.set("account", options.accountId);
    }

    const response = await this.fetch(
      url,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.options.apiKey}`,
          "Content-Type": "application/sparql-update",
        },
        body: update,
      },
    );
    if (!response.ok) {
      throw new Error(
        `Failed to execute SPARQL update: ${response.status} ${response.statusText}`,
      );
    }
  }

  /**
   * getUsage gets the usage for a specific world.
   */
  public async getUsage(
    worldId: string,
    options?: { accountId?: string },
  ): Promise<UsageBucketRecord[]> {
    const url = new URL(
      `${this.options.baseUrl}/worlds/${worldId}/usage`,
    );
    if (options?.accountId) {
      url.searchParams.set("account", options.accountId);
    }

    const response = await this.fetch(
      url,
      {
        headers: {
          Authorization: `Bearer ${this.options.apiKey}`,
        },
      },
    );
    if (!response.ok) {
      throw new Error(
        `Failed to get usage: ${response.status} ${response.statusText}`,
      );
    }
    return await response.json();
  }

  /**
   * search searches a world.
   */
  public async search(
    worldId: string,
    query: string,
    options?: {
      limit?: number;
      offset?: number;
      accountId?: string;
    },
  ): Promise<SearchResult> {
    const url = new URL(`${this.options.baseUrl}/worlds/${worldId}/search`);
    if (options?.accountId) {
      url.searchParams.set("account", options.accountId);
    }

    url.searchParams.set("q", query);
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
        `Failed to search world: ${response.status} ${response.statusText}`,
      );
    }

    return await response.json();
  }
}

/**
 * World is a TypeScript SDK for a World in the Worlds API.
 */
export class World {
  private readonly worlds: Worlds;

  public constructor(
    public readonly options: WorldsOptions & { worldId: string },
  ) {
    this.worlds = new Worlds(options);
  }

  /**
   * get gets the world.
   */
  public get(options?: { accountId?: string }): Promise<WorldRecord | null> {
    return this.worlds.get(this.options.worldId, options);
  }

  /**
   * remove removes the world.
   */
  public remove(options?: { accountId?: string }): Promise<void> {
    return this.worlds.remove(this.options.worldId, options);
  }

  /**
   * update updates the world.
   */
  public update(
    data: WorldRecord,
    options?: { accountId?: string },
  ): Promise<void> {
    return this.worlds.update(this.options.worldId, data, options);
  }

  /**
   * sparqlQuery executes a SPARQL query against the world.
   */
  public sparqlQuery(
    query: string,
    options?: { accountId?: string },
    // deno-lint-ignore no-explicit-any
  ): Promise<any> {
    return this.worlds.sparqlQuery(this.options.worldId, query, options);
  }

  /**
   * sparqlUpdate executes a SPARQL update against the world.
   */
  public sparqlUpdate(
    update: string,
    options?: { accountId?: string },
  ): Promise<void> {
    return this.worlds.sparqlUpdate(this.options.worldId, update, options);
  }

  /**
   * search searches within the world.
   */
  public search(
    query: string,
    options?: {
      limit?: number;
      offset?: number;
      accountId?: string;
    },
  ): Promise<SearchResult> {
    return this.worlds.search(this.options.worldId, query, options);
  }
}
