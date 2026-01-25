import type { Tool } from "ai";
import { tool } from "ai";
import { z } from "zod";

/**
 * createGenerateIriTool creates a tool that generates a unique IRI
 * (Internationalized Resource Identifier) for a new entity.
 */
export function createGenerateIriTool(
  generateIri: () => string,
): Tool<{ entityText?: string | undefined }, { iri: string }> {
  return tool({
    description: [
      "Generate a unique IRI for a new entity. Use this when you need to insert a new node into the graph.",
      "After generating an IRI, use executeSparql to insert the new entity into the knowledge base with an INSERT DATA or INSERT query.",
    ].join("\n\n"),
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
