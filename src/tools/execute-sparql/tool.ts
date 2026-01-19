import type { Tool } from "ai";
import { tool } from "ai";
import { z } from "zod";
import type { World } from "#/sdk/worlds.ts";

/**
 * createExecuteSparqlTool creates a tool that executes SPARQL queries and updates.
 */
export function createExecuteSparqlTool(world: World): Tool {
  return tool({
    description: `Execute a SPARQL query or update against the knowledge base.
Use this tool to:
- Research existing data and schema structure (SELECT, ASK, CONSTRUCT, DESCRIBE)
- Insert new facts (INSERT DATA, INSERT {})
- Delete obsolete facts (DELETE DATA, DELETE {})
- Update information
- Supports: SELECT, ASK, CONSTRUCT, DESCRIBE, INSERT, DELETE, LOAD, CLEAR
`,
    inputSchema: z.object({
      sparql: z.string().describe("The SPARQL query or update to execute."),
    }),
    execute: async ({ sparql }) => {
      return await world.sparql(sparql);
    },
  });
}
