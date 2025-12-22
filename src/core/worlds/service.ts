import type { Quad, Store, Term } from "oxigraph";
import type {
  Chunk,
  RankedResult,
  Statement,
  WorldMetadata,
} from "#/core/types/mod.ts";

export type { WorldMetadata };

/**
 * OxigraphService is the service for Oxigraph stores.
 */
export interface OxigraphService {
  listStores(): Promise<string[]>;
  getStore(id: string): Promise<Store | null>;
  getMetadata(id: string): Promise<WorldMetadata | null>;
  getManyMetadata(ids: string[]): Promise<(WorldMetadata | null)[]>;
  setStore(id: string, owner: string, store: Store): Promise<void>;
  addQuads(id: string, owner: string, quads: Quad[]): Promise<void>;
  query(
    id: string,
    query: string,
  ): Promise<boolean | Map<string, Term>[] | Quad[] | string>;
  update(id: string, query: string): Promise<void>;
  updateDescription(id: string, description: string): Promise<void>;
  removeStore(id: string): Promise<void>;

  // Search Capability
  searchStatements(
    id: string,
    query: string,
  ): Promise<RankedResult<Statement>[]>;
  getStatement(
    id: string,
    statementId: number,
  ): Promise<Statement | null>;
  searchChunks(
    id: string,
    query: string,
  ): Promise<RankedResult<Chunk>[]>;
  getChunk(
    id: string,
    chunkId: number,
  ): Promise<Chunk | null>;
}
