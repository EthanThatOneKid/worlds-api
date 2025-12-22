/**
 * RankedResult is a result from a reciprocal rank fusion search.
 */
export interface RankedResult<T> {
  /**
   * item is the item that was ranked.
   */
  item: T;

  /**
   * score is the final score of the item after RRF fusion.
   */
  score: number;

  /**
   * rank is a record of the rank of the item for each component of the search.
   * For example if we are searching by FTS and vector, the rank will be
   * `{ fts: number; vector: number }`.
   */
  rank: Record<string, number>;
}
