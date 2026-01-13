import type { SearchResult, UsageBucketRecord, WorldRecord } from "./types.ts";

/**
 * WorldsOptions are the options for the Worlds API SDK.
 */
export interface WorldsOptions {
  baseUrl: string;
  apiKey: string;
}

/**
 * Worlds is a TypeScript SDK for the Worlds API.
 */
export class Worlds {
  public constructor(
    public readonly options: WorldsOptions,
  ) {}

  /**
   * getWorlds gets all worlds from the Worlds API.
   */
  public async getWorlds(page = 1, pageSize = 20): Promise<WorldRecord[]> {
    const url = new URL(`${this.options.baseUrl}/worlds`);
    url.searchParams.set("page", page.toString());
    url.searchParams.set("pageSize", pageSize.toString());
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
   * getWorld gets a world from the Worlds API.
   */
  public async getWorld(
    worldId: string,
  ): Promise<WorldRecord | null> {
    const url = new URL(`${this.options.baseUrl}/worlds/${worldId}`);
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

  public async createWorld(data: WorldRecord): Promise<void> {
    const url = new URL(`${this.options.baseUrl}/worlds`);
    const response = await fetch(
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
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  public async updateWorld(worldId: string, data: WorldRecord): Promise<void> {
    const url = new URL(`${this.options.baseUrl}/worlds/${worldId}`);
    const response = await fetch(
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
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  /**
   * removeWorld removes a world from the Worlds API.
   */
  public async removeWorld(worldId: string): Promise<void> {
    const url = new URL(`${this.options.baseUrl}/worlds/${worldId}`);
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
   * sparqlQueryWorld executes a SPARQL query against a world in the Worlds API.
   * Uses POST with application/sparql-query for robustness.
   */
  public async sparqlQueryWorld(
    worldId: string,
    query: string,
  ): Promise<unknown> {
    const url = new URL(
      `${this.options.baseUrl}/worlds/${worldId}/sparql`,
    );
    const response = await fetch(
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
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const json = await response.json();
    return json;
  }

  /**
   * sparqlUpdateWorld executes a SPARQL update against a world in the Worlds API.
   */
  public async sparqlUpdateWorld(
    worldId: string,
    update: string,
  ): Promise<void> {
    const url = new URL(
      `${this.options.baseUrl}/worlds/${worldId}/sparql`,
    );
    const response = await fetch(
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
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  /**
   * getWorldUsage gets the usage for a specific world.
   */
  public async getWorldUsage(
    worldId: string,
  ): Promise<UsageBucketRecord[]> {
    const url = new URL(
      `${this.options.baseUrl}/worlds/${worldId}/usage`,
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
   * searchWorld searches a world.
   */
  public async searchWorld(
    worldId: string,
    query: string,
    options?: {
      limit?: number;
      offset?: number;
    },
  ): Promise<SearchResult> {
    const url = new URL(`${this.options.baseUrl}/worlds/${worldId}/search`);
    url.searchParams.set("q", query);
    if (options?.limit) {
      url.searchParams.set("limit", options.limit.toString());
    }

    if (options?.offset) {
      url.searchParams.set("offset", options.offset.toString());
    }

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
  public get(): Promise<WorldRecord | null> {
    return this.worlds.getWorld(this.options.worldId);
  }

  /**
   * remove removes the world.
   */
  public remove(): Promise<void> {
    return this.worlds.removeWorld(this.options.worldId);
  }

  /**
   * update updates the world.
   */
  public update(data: WorldRecord): Promise<void> {
    return this.worlds.updateWorld(this.options.worldId, data);
  }

  /**
   * sparqlQuery executes a SPARQL query against the world.
   */
  // deno-lint-ignore no-explicit-any
  public sparqlQuery(query: string): Promise<any> {
    return this.worlds.sparqlQueryWorld(this.options.worldId, query);
  }

  /**
   * sparqlUpdate executes a SPARQL update against the world.
   */
  public sparqlUpdate(update: string): Promise<void> {
    return this.worlds.sparqlUpdateWorld(this.options.worldId, update);
  }
  /**
   * search searches within the world.
   */
  public search(
    query: string,
    options?: {
      limit?: number;
      offset?: number;
    },
  ): Promise<SearchResult> {
    return this.worlds.searchWorld(this.options.worldId, query, options);
  }
}
