import type { Tool } from "ai";
import { tool } from "ai";
import { z } from "zod";

/**
 * createGenerateIriTool creates a tool that generates a unique IRI
 * (Internationalized Resource Identifier) for a new entity.
 */
export function createGenerateIriTool(generateIri: () => string): Tool {
  return tool({
    description:
      "Generate a unique IRI for a new entity. Use this when you need to insert a new node into the graph.",
    inputSchema: z.object({
      entityText: z.string().optional().describe(
        "The text of the entity as seen in the given text. Helps associate the IRI with the mentioned entity.",
      ),
    }),
    execute: () => {
      return { iri: generateIri() };
    },
  });
}
