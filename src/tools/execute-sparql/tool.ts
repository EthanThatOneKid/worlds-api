import type { Tool } from "ai";
import { tool } from "ai";
import { z } from "zod";
import type { SparqlResult } from "#/sdk/types.ts";
import { Worlds } from "#/sdk/worlds.ts";
import type { CreateToolsOptions } from "#/tools/types.ts";

/**
 * createExecuteSparqlTool creates a tool that executes SPARQL queries and updates.
 */
export function createExecuteSparqlTool(
  options: CreateToolsOptions,
): Tool<{
  sparql: string;
  worldId?: string;
}, SparqlResult | null> {
  const worlds = new Worlds(options);
  const defaultWorldId = options.worldIds[0];
  return tool({
    description:
      `Execute a SPARQL query or update against a specific world knowledge base.
Use this tool to:
- Research existing data and schema structure (SELECT, ASK, CONSTRUCT, DESCRIBE)
- Insert new facts (INSERT DATA, INSERT {})
- Delete obsolete facts (DELETE DATA, DELETE {})
- Update information
- Supports: SELECT, ASK, CONSTRUCT, DESCRIBE, INSERT, DELETE, LOAD, CLEAR

You MUST specify the relevant worldId if it's not the default (${defaultWorldId}).
`,
    inputSchema: z.object({
      sparql: z.string().describe("The SPARQL query or update to execute."),
      worldId: z.string().optional().describe(
        `The ID of the world to execute the query against (default: ${defaultWorldId}).`,
      ),
    }),
    execute: async ({ sparql, worldId }) => {
      const targetWorldId = worldId ?? defaultWorldId;
      if (!targetWorldId) {
        throw new Error("No worldId provided and no default available.");
      }
      return await worlds.sparql(targetWorldId, sparql);
    },
  });
}
