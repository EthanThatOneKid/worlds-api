import { ulid } from "@std/ulid/ulid";
import { createExecuteSparqlTool } from "./execute-sparql/tool.ts";
import { createSearchFactsTool } from "./search-facts/tool.ts";
import { createGenerateIriTool } from "./generate-iri/tool.ts";
import type { CreateToolsOptions } from "./types.ts";
import { getDefaultSource, validateSources } from "./utils.ts";

/**
 * generateIri generates a random IRI using the ulid library
 * and a default prefix.
 */
export function generateIri(generateId: () => string = ulid): string {
  return `https://wazoo.tech/.well-known/genid/${generateId()}`;
}

export function createTools(options: CreateToolsOptions): {
  executeSparql: ReturnType<typeof createExecuteSparqlTool>;
  searchFacts: ReturnType<typeof createSearchFactsTool>;
  generateIri?: ReturnType<typeof createGenerateIriTool>;
} {
  // Validate sources for duplicates
  validateSources(options.sources);

  // If write mode is enabled, require a default source
  if (options.write) {
    const defaultSource = getDefaultSource(options.sources);
    if (!defaultSource) {
      throw new Error(
        "Write mode requires a default source to be configured",
      );
    }
  }

  const tools: {
    executeSparql: ReturnType<typeof createExecuteSparqlTool>;
    searchFacts: ReturnType<typeof createSearchFactsTool>;
    generateIri?: ReturnType<typeof createGenerateIriTool>;
  } = {
    executeSparql: createExecuteSparqlTool(options),
    searchFacts: createSearchFactsTool(options),
  };

  if (options.write) {
    tools.generateIri = createGenerateIriTool(
      options.generateIri ?? generateIri,
    );
  }

  return tools;
}
