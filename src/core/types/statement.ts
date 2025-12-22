/**
 * Statement represents a semantic triple/quad in the Knowledge Graph.
 */
export interface Statement {
  statementId: number;
  subject: string;
  predicate: string;
  object: string;
  graph: string;
  termType?: "NamedNode" | "BlankNode" | "Literal" | "DefaultGraph";
  objectLanguage?: string;
  objectDatatype?: string;
}
