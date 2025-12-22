import type { Quad, Store, Term } from "oxigraph";

/**
 * OxigraphService is the service for Oxigraph stores.
 */
export interface OxigraphService {
  get(id: string): Promise<Store | null>;
  set(id: string, store: Store): Promise<void>;
  addQuads(id: string, quads: Quad[]): Promise<void>;
  query(
    id: string,
    query: string,
  ): Promise<boolean | Map<string, Term>[] | Quad[] | string>;
  update(id: string, query: string): Promise<void>;
}
