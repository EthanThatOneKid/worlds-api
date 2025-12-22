export { default as statementsSql } from "./statements.sql" with { type: "text" };

/**
 * TermRow is a row in the terms table.
 */
export interface TermRow {
  id: number;
  value: string;
  term_type: "NamedNode" | "BlankNode" | "Literal" | "DefaultGraph";
  language: string;
  datatype: string;
}

/**
 * ChunkRow is a row in the chunks table.
 */
export interface ChunkRow {
  id: number;
  term_id: number;
  text_content: string;
  // Embedding is stored in chunks_vec, virtual table usually handled separately
  // or via join.
}

/**
 * StatementRow represents a raw row in the statements_* tables.
 * Contains IDs referencing the terms table.
 */
export interface StatementRow {
  subject_id: number;
  predicate_id: number;
  object_id: number;
  graph_id: number;
}

/**
 * RankedResult is a result from a reciprocal rank fusion search.
 */
export interface RankedResult<T> {
  item: T;
  score: number;
  rank: Record<string, number>;
}

export interface StatementsStore {
  // GRAPHS.

  getGraph(graphId: string): Promise<StatementRow[]>;

  removeGraph(graphId: string): Promise<void>;

  // STATEMENTS.

  insertStatement(statement: StatementRow): Promise<void>;

  insertStatements(statements: StatementRow[]): Promise<void>;

  /**
   * removes a specific statement.
   */
  removeStatement(statement: StatementRow): Promise<void>;

  /**
   * searchStatements searches for statements via FTS/Vector on Object.
   */
  searchStatements(
    query: string,
    k?: number,
  ): Promise<RankedResult<StatementRow>[]>;

  // CHUNKS.

  /**
   * getChunk gets a chunk by ID.
   */
  getChunk(
    chunkId: number,
  ): Promise<ChunkRow & { text_content: string } | null>;

  searchChunks(query: string, k?: number): Promise<RankedResult<ChunkRow>[]>;
}
