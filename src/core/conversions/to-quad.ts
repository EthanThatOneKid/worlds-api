import type { Quad } from "@rdfjs/types";
import { namedNode, quad, type Quad_Object } from "oxigraph";
import type { HydratedStatement } from "#/core/database/statements.ts";
import { toTerm } from "./to-term.ts";

// TODO: Complete `./src/core/conversions` module.

/**
 * toQuad converts a HydratedStatement to a Quad.
 */
export function toQuad(
  statement: HydratedStatement,
  skolemizedStatements: HydratedStatement[],
): Quad {
  return quad(
    namedNode(statement.subject),
    namedNode(statement.predicate),
    toTerm(statement, skolemizedStatements) as Quad_Object,
    namedNode(statement.graph),
  );
}
