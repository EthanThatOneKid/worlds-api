import type { Term } from "@rdfjs/types";
import { blankNode, defaultGraph, literal, namedNode } from "oxigraph";
import type { HydratedStatement } from "#/core/database/statements.ts";

/**
 * toTerm converts a HydratedStatement to a Term.
 */
export function toTerm(
  statement: HydratedStatement,
  _skolemizedStatements: HydratedStatement[],
): Term {
  switch (statement.term_type) {
    case "NamedNode": {
      return namedNode(statement.object);
    }

    case "BlankNode": {
      // TODO: Deskolemize blank nodes.
      // return skolemizedNode(skolemizedStatements, statement.object);
      return blankNode(statement.object);
    }

    case "Literal": {
      return literal(statement.object);
    }

    case "DefaultGraph": {
      return defaultGraph();
    }

    default: {
      throw new Error(`Unknown term type: ${statement.term_type}`);
    }
  }
}

// I am introducing the concept of this skolemizedNode helper to dereference blank nodes from the skolemized statements.
//

export function skolemizedNode(
  skolemizedStatements: StatementRow[],
  id: string,
) {
  const statement = skolemizedStatements.find((s) => s.subject === id);
  if (!statement) {
    throw new Error(`No statement found for blank node: ${id}`);
  }

  return blankNode();
}
