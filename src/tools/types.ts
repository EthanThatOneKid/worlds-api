import type { WorldsOptions } from "#/sdk/mod.ts";

/**
 * CreateToolsOptions are the options for creating tools.
 */
export interface CreateToolsOptions extends WorldsOptions {
  /**
   * worldIds are the IDs of the worlds.
   */
  worldIds: string[];

  /**
   * generateIri is a function that generates an IRI for new entities.
   */
  generateIri?: () => string;
}
