import { toArrayBuffer } from "@std/streams";
import type { Store } from "oxigraph";
import type { OxigraphService } from "./oxigraph-service.ts";
import type { DecodableEncoding } from "./oxigraph-encoding.ts";
import {
  decodableEncodings,
  decodeStore,
  encodeStore,
} from "./oxigraph-encoding.ts";

export class DenoKvOxigraphService implements OxigraphService {
  public constructor(
    private readonly kv: Deno.Kv,
    private readonly prefix: Deno.KvKey = ["stores"],
    private readonly storageEncoding: DecodableEncoding = decodableEncodings.nq,
    private readonly compressionFormat: CompressionFormat = "gzip",
  ) {}

  public async getStore(id: string): Promise<Store | null> {
    const result = await this.kv.get<Uint8Array>([...this.prefix, id]);
    if (result.value === null) {
      return null;
    }

    // Convert the stored Uint8Array back into a stream for the decoder
    const stream = ReadableStream.from([result.value]);

    return await decodeStore(
      stream,
      this.storageEncoding,
      new DecompressionStream(this.compressionFormat),
    );
  }

  public async setStore(id: string, store: Store): Promise<void> {
    // 1. Get the stream from the encoder
    const stream = encodeStore(
      store,
      this.storageEncoding,
      new CompressionStream(this.compressionFormat),
    );

    // 2. Consume the stream into a Uint8Array (required for Deno KV atomic storage)
    const encodedBuffer = new Uint8Array(await toArrayBuffer(stream));

    await this.kv.set([...this.prefix, id], encodedBuffer);
  }

  public async removeStore(id: string): Promise<void> {
    await this.kv.delete([...this.prefix, id]);
  }
}
