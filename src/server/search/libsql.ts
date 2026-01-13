import type { Client } from "@libsql/client";
import type { Patch, SearchResult, SearchStore } from "@fartlabs/search-store";
import { skolemizeQuad } from "@fartlabs/search-store";

// TODO: Include an rdfjs.Quad in the search result item
// TODO: Implement overlapping chunks for better context

/**
 * SearchResultItem is a result from a search query.
 */
export interface SearchResultItem {
  /**
   * subject is the subject node (IRI) of the result.
   */
  subject: string;

  /**
   * predicate is the predicate node (IRI) of the result.
   */
  predicate: string;

  /**
   * object is the object node (string literal) of the result.
   */
  object: string;
}

/**
 * LibsqlSearchStoreOptions are options for the LibsqlSearchStore.
 */
export interface LibsqlSearchStoreOptions {
  /**
   * client is the Libsql client to use for database operations.
   */
  client: Client;

  /**
   * embeddings are options for generating vector embeddings.
   */
  embeddings: {
    /**
     * embed is a function that generates a vector embedding for a given text.
     */
    embed: (text: string) => Promise<number[]>;

    /**
     * dimensions is the dimensionality of the vector embeddings.
     */
    dimensions: number;
  };
}

/**
 * LibsqlSearchStore implements the SearchStore interface using Libsql as the backend.
 */
export class LibsqlSearchStore implements SearchStore<SearchResultItem> {
  public constructor(private readonly options: LibsqlSearchStoreOptions) {}

  public async createTables() {
    await this.options.client.batch([
      // Main data table with vector column.
      {
        sql: `CREATE TABLE IF NOT EXISTS documents (
          id TEXT PRIMARY KEY,
          subject TEXT NOT NULL,
          predicate TEXT NOT NULL,
          object TEXT NOT NULL,
          embedding F32_BLOB(${this.options.embeddings.dimensions}),
          UNIQUE(subject, predicate, object)
        )`,
      },

      // Vector index.
      {
        sql:
          `CREATE INDEX IF NOT EXISTS search_idx ON documents(libsql_vector_idx(embedding))`,
      },

      // FTS virtual table.
      {
        sql: `CREATE VIRTUAL TABLE IF NOT EXISTS search_fts USING fts5(
          object,
          content='documents',
          content_rowid='rowid'
        )`,
      },

      // Triggers to keep FTS in sync.
      {
        sql:
          `CREATE TRIGGER IF NOT EXISTS documents_ai AFTER INSERT ON documents BEGIN
          INSERT INTO search_fts(rowid, object) VALUES (new.rowid, new.object);
        END`,
      },
      {
        sql:
          `CREATE TRIGGER IF NOT EXISTS documents_ad AFTER DELETE ON documents BEGIN
          INSERT INTO search_fts(search_fts, rowid, object) VALUES('delete', old.rowid, old.object);
        END`,
      },
      {
        sql:
          `CREATE TRIGGER IF NOT EXISTS documents_au AFTER UPDATE ON documents BEGIN
          INSERT INTO search_fts(search_fts, rowid, object) VALUES('delete', old.rowid, old.object);
          INSERT INTO search_fts(rowid, object) VALUES (new.rowid, new.object);
        END`,
      },
    ], "write");
  }

  public async patch(patches: Patch[]): Promise<void> {
    for (const { insertions, deletions } of patches) {
      if (deletions.length > 0) {
        const deleteStmts = await Promise.all(
          deletions.map(async (quad) => ({
            sql: "DELETE FROM documents WHERE id = ?",
            args: [await skolemizeQuad(quad)],
          })),
        );
        await this.options.client.batch(deleteStmts, "write");
      }

      if (insertions.length > 0) {
        const insertStmts = await Promise.all(
          insertions.map(async (quad) => ({
            sql:
              "INSERT OR REPLACE INTO documents (id, subject, predicate, object, embedding) VALUES (?, ?, ?, ?, vector32(?))",
            args: [
              await skolemizeQuad(quad),
              quad.subject.value,
              quad.predicate.value,
              quad.object.value,
              JSON.stringify(
                await this.options.embeddings.embed(quad.object.value),
              ),
            ],
          })),
        );
        await this.options.client.batch(insertStmts, "write");
      }
    }
  }

  public async search(
    query: string,
    limit = 10,
  ): Promise<SearchResult<SearchResultItem>[]> {
    const embedding = await this.options.embeddings.embed(query);
    const vectorString = JSON.stringify(embedding);

    // Hybrid search using RRF (Reciprocal Rank Fusion)
    const result = await this.options.client.execute({
      sql: `
      WITH vec_matches AS (
        SELECT
          id as rowid,
          row_number() OVER (PARTITION BY NULL) as rank_number
        FROM vector_top_k('search_idx', vector32(?), ?)
      ),
      fts_matches AS (
        SELECT
          rowid,
          row_number() OVER (ORDER BY rank) as rank_number,
          rank as score
        FROM search_fts
        WHERE search_fts MATCH ?
        LIMIT ?
      ),
      final AS (
        SELECT
          documents.subject,
          documents.predicate,
          documents.object,
          vec_matches.rank_number as vec_rank,
          fts_matches.rank_number as fts_rank,
          (
            COALESCE(1.0 / (60 + fts_matches.rank_number), 0.0) * 1.0 +
            COALESCE(1.0 / (60 + vec_matches.rank_number), 0.0) * 1.0
          ) as combined_rank
        FROM fts_matches
        FULL OUTER JOIN vec_matches ON vec_matches.rowid = fts_matches.rowid
        JOIN documents ON documents.rowid = COALESCE(fts_matches.rowid, vec_matches.rowid)
        ORDER BY combined_rank DESC
        LIMIT ?
      )
      SELECT * FROM final
    `,
      args: [vectorString, limit, query, limit, limit],
    });

    return result.rows.map((row) => ({
      score: row.combined_rank as number,
      value: {
        subject: row.subject as string,
        predicate: row.predicate as string,
        object: row.object as string,
      },
    }));
  }
}
