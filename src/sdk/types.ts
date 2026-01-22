import type { SearchResult as _SearchResult } from "@fartlabs/search-store";
import type { ModelMessage } from "ai";

/**
 * WorldsOptions are the options for the Worlds API SDK.
 */
export interface WorldsOptions {
  baseUrl: string;
  apiKey: string;

  /**
   * fetch fetches a resource from the network. It returns a `Promise` that
   * resolves to the `Response` to that `Request`, whether it is successful
   * or not.
   */
  fetch?: typeof globalThis.fetch;
}

// TODO: Update SearchResultItem type for consistency with RDF/JS term types.

/**
 * SearchResult represents a search result.
 */
export type SearchResult = _SearchResult<{
  subject: string;
  predicate: string;
  object: string;
}>;

/**
 * CreateWorldParams represents the parameters for creating a world.
 */
export type CreateWorldParams = Omit<
  WorldRecord,
  "id" | "accountId" | "createdAt" | "updatedAt" | "deletedAt"
>;

/**
 * UpdateWorldParams represents the parameters for updating a world.
 */
export type UpdateWorldParams = Partial<CreateWorldParams>;

/**
 * WorldRecord represents a world in the Worlds API.
 */
export interface WorldRecord {
  id: string;
  accountId: string;
  label: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
  isPublic?: boolean;
}

/**
 * SparqlValue represents a value in a SPARQL result.
 */
export interface SparqlValue {
  type: "uri" | "literal" | "bnode";
  value: string;
  "xml:lang"?: string;
  datatype?: string;
}

/**
 * SparqlBinding represents a single result binding.
 */
export type SparqlBinding = Record<string, SparqlValue>;

/**
 * SparqlResult represents the result of a SPARQL query.
 *
 * @see https://www.w3.org/TR/sparql11-results-json/
 */
export type SparqlResult =
  | SparqlSelectResults
  | SparqlAskResults
  | SparqlQuadsResults;

/**
 * SparqlSelectResults represents the results of a SPARQL SELECT query.
 */
export interface SparqlSelectResults {
  head: {
    vars: string[];
    link?: string[];
  };
  results: {
    bindings: SparqlBinding[];
  };
  boolean?: undefined;
}

/**
 * SparqlAskResults represents the results of a SPARQL ASK query.
 */
export interface SparqlAskResults {
  head: {
    link?: string[];
  };
  boolean: boolean;
  results?: undefined;
}

/**
 * SparqlQuad represents a single quad result (for CONSTRUCT/DESCRIBE).
 */
export interface SparqlQuad {
  subject: { type: "uri" | "bnode"; value: string };
  predicate: { type: "uri"; value: string };
  object: SparqlValue;
  graph: { type: "default" | "uri"; value: string };
}

/**
 * SparqlQuadsResults represents the results of a SPARQL CONSTRUCT/DESCRIBE query.
 */
export interface SparqlQuadsResults {
  head: {
    link?: string[];
  };
  results: {
    quads: SparqlQuad[];
  };
  boolean?: undefined;
}

/**
 * ConversationRecord represents a conversation in a world.
 */
export interface ConversationRecord {
  id: string;
  worldId: string;
  label?: string | null;
  createdAt: number;
  updatedAt: number;
  metadata?: Record<string, unknown>;
}

/**
 * MessageRecord represents a message in a conversation.
 */
export interface MessageRecord {
  id: string;
  worldId: string;
  conversationId: string;
  content: ModelMessage;
  createdAt: number;
}

/**
 * CreateConversationParams represents the parameters for creating a conversation.
 */
export type CreateConversationParams = Omit<
  ConversationRecord,
  "id" | "worldId" | "createdAt" | "updatedAt"
>;

/**
 * UpdateConversationParams represents the parameters for updating a conversation.
 */
export type UpdateConversationParams = Partial<CreateConversationParams>;

/**
 * CreateMessageParams represents the parameters for creating a message.
 */
export type CreateMessageParams = Omit<
  MessageRecord,
  "id" | "worldId" | "conversationId" | "createdAt"
>;

/**
 * UpdateMessageParams represents the parameters for updating a message.
 */
export type UpdateMessageParams = Partial<CreateMessageParams>;
