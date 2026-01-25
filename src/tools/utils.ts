import type { CreateToolsOptions, SourceOptions } from "./types.ts";

/**
 * getDefaultSource finds the source marked as default.
 * Throws an error if more than one default source is found.
 */
export function getDefaultSource(
  sources?: SourceOptions[],
): SourceOptions | undefined {
  if (!sources) {
    return;
  }

  if (sources.length === 1) {
    return sources[0];
  }

  const defaultSources = sources.filter((source) => source.default === true);
  if (defaultSources.length > 1) {
    const worldIds = defaultSources.map((source) => source.worldId).join(", ");
    throw new Error(
      `Multiple default sources found. Only one source can be marked as default. Found default sources with worldIds: ${worldIds}`,
    );
  }

  return defaultSources[0];
}

/**
 * getSourceByWorldId finds a source by its worldId.
 */
export function getSourceByWorldId(
  options: CreateToolsOptions,
  worldId: string,
): SourceOptions | undefined {
  return options.sources?.find((source) => source.worldId === worldId);
}

/**
 * isUpdateQuery checks if a SPARQL query is an update operation.
 * This is a simple regex-based check for SDK-level tools.
 */
export function isUpdateQuery(query: string): boolean {
  // Normalize the query: remove comments and normalize whitespace
  const normalized = query
    .replace(/#[^\n]*/g, "") // Remove comments
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim()
    .toUpperCase();

  // Check for update keywords at the start (after optional prefixes)
  // Update operations: INSERT, DELETE, LOAD, CLEAR, DROP, CREATE, ADD, MOVE, COPY
  const updateKeywords = [
    "INSERT",
    "DELETE",
    "LOAD",
    "CLEAR",
    "DROP",
    "CREATE",
    "ADD",
    "MOVE",
    "COPY",
  ];

  // Check if query starts with any update keyword (accounting for PREFIX and BASE declarations)
  const prologueMatch = normalized.match(
    /^(?:(?:PREFIX\s+\w+:\s*<[^>]+>|BASE\s+<[^>]+>)\s*)*/,
  );
  const afterPrologue = normalized.slice(prologueMatch?.[0]?.length ?? 0)
    .trim();

  return updateKeywords.some((keyword) => afterPrologue.startsWith(keyword));
}
