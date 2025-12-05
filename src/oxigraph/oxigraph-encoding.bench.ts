import { toArrayBuffer } from "@std/streams";
import { namedNode, quad, Store } from "oxigraph";
import {
  decodableEncodings,
  decodeStore,
  encodeStore,
} from "./oxigraph-encoding.ts";

const compressionFormats: CompressionFormat[] = [
  "deflate",
  "deflate-raw",
  "gzip",
];

const decodedStore = new Store();
decodedStore.add(
  quad(
    namedNode("http://example.com/subject"),
    namedNode("http://example.com/predicate"),
    namedNode("http://example.com/object"),
  ),
);

for (const [name, encoding] of Object.entries(decodableEncodings)) {
  // Pre-calculate encoded bytes for decoding benchmarks
  const encodedStream = encodeStore(decodedStore, encoding);
  const encodedBytes = new Uint8Array(await toArrayBuffer(encodedStream));

  Deno.bench({
    name: `decodeStore ${name}`,
    fn: async () => {
      // Must create a fresh stream for each iteration
      const stream = ReadableStream.from([encodedBytes]);
      await decodeStore(stream, encoding);
    },
  });

  for (const compressionFormat of compressionFormats) {
    const compressedStream = encodeStore(
      decodedStore,
      encoding,
      new CompressionStream(compressionFormat),
    );
    const compressedBytes = new Uint8Array(
      await toArrayBuffer(compressedStream),
    );

    Deno.bench({
      name: `decodeStore ${name} with ${compressionFormat}`,
      fn: async () => {
        const stream = ReadableStream.from([compressedBytes]);
        await decodeStore(
          stream,
          encoding,
          new DecompressionStream(compressionFormat),
        );
      },
    });
  }

  Deno.bench({
    name: `encodeStore ${name}`,
    fn: async () => {
      const stream = encodeStore(decodedStore, encoding);
      await toArrayBuffer(stream);
    },
  });

  for (const compressionFormat of compressionFormats) {
    Deno.bench({
      name: `encodeStore ${name} with ${compressionFormat}`,
      fn: async () => {
        const stream = encodeStore(
          decodedStore,
          encoding,
          new CompressionStream(compressionFormat),
        );
        await toArrayBuffer(stream);
      },
    });
  }
}
