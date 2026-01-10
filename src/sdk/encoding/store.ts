// TODO: Encoding/Decoding of RDF Stores.

// /**
//  * DecodableEncoding is the type of encoding format that can be decoded.
//  */
// export type DecodableEncoding =
//   typeof decodableEncodings[keyof typeof decodableEncodings];

// /**
//  * decodableEncodings is the set of encoding format that can be decoded.
//  */
// export const decodableEncodings = {
//   jsonld: "application/ld+json",
//   nq: "application/n-quads",
//   trig: "application/trig",
// } as const;

// /**
//  * isDecodableEncoding checks if the value is a DecodableEncoding.
//  */
// export function isDecodableEncoding(
//   value: string,
// ): value is DecodableEncoding {
//   return typeof value === "string" &&
//     Object.values(decodableEncodings).includes(value as DecodableEncoding);
// }

// /**
//  * EncodableEncoding is the type of encoding format that can be encoded.
//  */
// export type EncodableEncoding =
//   typeof encodableEncodings[keyof typeof encodableEncodings];

// /**
//  * encodableEncodings is the set of encoding format that can be encoded.
//  */
// export const encodableEncodings = {
//   ...decodableEncodings,
//   ttl: "text/turtle",
//   nt: "application/n-triples",
//   n3: "text/n3",
//   rdf: "application/rdf+xml",
// } as const;

// /**
//  * isEncodableEncoding checks if the value is an EncodableEncoding.
//  */
// export function isEncodableEncoding(
//   value: string,
// ): value is EncodableEncoding {
//   return typeof value === "string" &&
//     Object.values(encodableEncodings).includes(value as EncodableEncoding);
// }
