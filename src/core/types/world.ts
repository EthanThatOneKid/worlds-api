/**
 * WorldMetadata contains metadata about a store.
 */
export interface WorldMetadata {
  /**
   * id is the store ID.
   */
  id: string;

  /**
   * description is the description of the store.
   */
  description: string;

  /**
   * size is the size of the store in bytes.
   */
  size: number;

  /**
   * tripleCount is the number of triples in the store.
   */
  tripleCount: number;

  /**
   * createdAt is the time the store was created.
   */
  createdAt: number;

  /**
   * createdBy is the account ID of the user who created the store.
   */
  createdBy: string;

  /**
   * updatedAt is the time the store was last updated.
   */
  updatedAt: number;
}
