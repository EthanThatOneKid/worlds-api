import type {
  Chunk,
  RankedResult,
  Statement,
  UsageBucket,
  WorldMetadata,
} from "../core/types/mod.ts";

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
  public async getWorlds(): Promise<WorldMetadata[]> {
    const url = new URL(`${this.options.baseUrl}/worlds`);
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
    encoding: string,
  ): Promise<string | null> {
    const url = new URL(`${this.options.baseUrl}/worlds/${worldId}`);
    const response = await fetch(
      url,
      {
        headers: {
          Authorization: `Bearer ${this.options.apiKey}`,
          "Accept": encoding,
        },
      },
    );
    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.text();
  }

  /**
   * setWorld sets a world in the Worlds API.
   */
  public async setWorld(
    worldId: string,
    world: string,
    encoding: string,
  ): Promise<void> {
    const url = new URL(`${this.options.baseUrl}/worlds/${worldId}`);
    const response = await fetch(
      url,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${this.options.apiKey}`,
          "Content-Type": encoding,
        },
        body: world,
      },
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  /**
   * addQuads adds quads to a world in the Worlds API.
   */
  public async addQuads(
    worldId: string,
    data: string,
    encoding: string,
  ): Promise<void> {
    const url = new URL(`${this.options.baseUrl}/worlds/${worldId}`);
    const response = await fetch(
      url,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.options.apiKey}`,
          "Content-Type": encoding,
        },
        body: data,
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
   * queryWorld executes a SPARQL query against a world in the Worlds API.
   * Uses POST with application/sparql-query for robustness.
   */
  public async queryWorld(
    worldId: string,
    query: string,
    // deno-lint-ignore no-explicit-any
  ): Promise<any> {
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
   * updateWorld executes a SPARQL update against a world in the Worlds API.
   */
  public async updateWorld(
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
   * updateMetadata updates the metadata of a world.
   */
  public async updateMetadata(
    worldId: string,
    metadata: WorldMetadata,
  ): Promise<void> {
    const url = new URL(`${this.options.baseUrl}/worlds/${worldId}`);
    const response = await fetch(
      url,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${this.options.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(metadata),
      },
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  /**
   * getStatement gets a specific statement.
   */
  public async getStatement(
    worldId: string,
    statementId: number,
  ): Promise<Statement | null> {
    const url = new URL(
      `${this.options.baseUrl}/worlds/${worldId}/statements/${statementId}`,
    );
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
   * searchStatements searches for statements.
   */
  public async searchStatements(
    worldId: string,
    query: string,
  ): Promise<RankedResult<Statement>[]> {
    const url = new URL(
      `${this.options.baseUrl}/worlds/${worldId}/statements`,
    );
    url.searchParams.set("query", query);
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
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  }

  /**
   * getChunk gets a specific chunk.
   */
  public async getChunk(
    worldId: string,
    chunkId: number,
  ): Promise<Chunk | null> {
    const url = new URL(
      `${this.options.baseUrl}/worlds/${worldId}/chunks/${chunkId}`,
    );
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
   * searchChunks searches for chunks.
   */
  public async searchChunks(
    worldId: string,
    query: string,
  ): Promise<RankedResult<Chunk>[]> {
    const url = new URL(
      `${this.options.baseUrl}/worlds/${worldId}/chunks`,
    );
    url.searchParams.set("query", query);
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
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * getWorldUsage gets the usage for a specific world.
   */
  public async getWorldUsage(
    worldId: string,
  ): Promise<UsageBucket[]> {
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
  public get(encoding: string): Promise<string | null> {
    return this.worlds.getWorld(this.options.worldId, encoding);
  }

  /**
   * set sets the world.
   */
  public set(world: string, encoding: string): Promise<void> {
    return this.worlds.setWorld(this.options.worldId, world, encoding);
  }

  /**
   * addQuads adds quads to the world.
   */
  public addQuads(data: string, encoding: string): Promise<void> {
    return this.worlds.addQuads(this.options.worldId, data, encoding);
  }

  /**
   * remove removes the world.
   */
  public remove(): Promise<void> {
    return this.worlds.removeWorld(this.options.worldId);
  }

  /**
   * query executes a SPARQL query against the world.
   */
  // deno-lint-ignore no-explicit-any
  public query(query: string): Promise<any> {
    return this.worlds.queryWorld(this.options.worldId, query);
  }

  /**
   * update executes a SPARQL update against the world.
   */
  public update(update: string): Promise<void> {
    return this.worlds.updateWorld(this.options.worldId, update);
  }

  /**
   * searchStatements searches for statements in the world.
   */
  public searchStatements(query: string): Promise<RankedResult<Statement>[]> {
    return this.worlds.searchStatements(this.options.worldId, query);
  }

  /**
   * getStatement gets a specific statement.
   */
  public getStatement(statementId: number): Promise<Statement | null> {
    return this.worlds.getStatement(this.options.worldId, statementId);
  }

  /**
   * searchChunks searches for chunks in the world.
   */
  public searchChunks(query: string): Promise<RankedResult<Chunk>[]> {
    return this.worlds.searchChunks(this.options.worldId, query);
  }

  /**
   * getChunk gets a specific chunk.
   */
  public getChunk(chunkId: number): Promise<Chunk | null> {
    return this.worlds.getChunk(this.options.worldId, chunkId);
  }

  /**
   * updateMetadata updates the world's metadata.
   */
  public updateMetadata(metadata: WorldMetadata): Promise<void> {
    return this.worlds.updateMetadata(
      this.options.worldId,
      metadata,
    );
  }
}
