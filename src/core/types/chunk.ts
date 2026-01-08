/**
 * Chunk represents a text segment derived from a Statement's Object.
 */
export interface Chunk {
  chunkId: number;
  statementId: number;
  content: string;
  embedding: number[];
}
