import type { Tool } from "ai";
import { tool } from "ai";
import { z } from "zod";
import type { WorldsSearchResult } from "#/sdk/types.ts";
import { Worlds } from "#/sdk/worlds.ts";
import type { CreateToolsOptions } from "#/tools/types.ts";

// TODO: Add worldIds (optional, falls back to options.worldIds) to input schema. Specify which worlds to search.

/**
 * createSearchFactsTool creates a search facts tool for a world.
 */
export function createSearchFactsTool(options: CreateToolsOptions): Tool<{
  query: string;
  limit?: number | undefined;
  worldIds?: string[] | undefined;
}, WorldsSearchResult[]> {
  const worlds = new Worlds(options);
  return tool({
    description:
      `Search for facts across knowledge bases using full-text and semantic vector search. This tool is ideal for discovering entities, relationships, and information when you don't know exact IRIs or want to explore topics broadly.

Each result includes the fact (subject, predicate, object), a relevance score, and a 'worldId' field identifying which world contains that fact. Use the worldId values from search results to determine which specific world to query with executeSparql when you need to perform targeted SPARQL queries or updates.`,
    inputSchema: z.object({
      query: z.string().describe(
        "A text query to search for facts. Can be an entity name, description, or any text that might match facts in the knowledge base. Examples: 'Ethan', 'Nancy', 'meeting at cafe', 'person named John'.",
      ),
      limit: z.number().min(1).max(100).optional().describe(
        "Maximum number of facts to return (default: 10). Use lower limits for focused searches, higher limits when exploring broadly.",
      ),
      worldIds: z.array(z.string()).optional().describe(
        "Optional list of world IDs to search within. If not provided, searches all configured worlds.",
      ),
    }),
    execute: async ({ query, limit, worldIds }) => {
      return await worlds.search(query, {
        worldIds: worldIds ?? options.worldIds,
        limit: limit ?? 10,
      });
    },
  });
}
