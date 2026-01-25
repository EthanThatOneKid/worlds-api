import type { Tool } from "ai";
import { tool } from "ai";
import { z } from "zod";
import type { CreateToolsOptions } from "#/tools/types.ts";
import { formatGenerateIriDescription } from "#/tools/format.ts";

/**
 * createGenerateIriTool creates a tool that generates a unique IRI
 * (Internationalized Resource Identifier) for a new entity.
 */
export function createGenerateIriTool(
  generateIri: () => string,
  options: CreateToolsOptions,
): Tool<{ entityText?: string | undefined }, { iri: string }> {
  return tool({
    description: formatGenerateIriDescription(options),
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
