import { toArrayBuffer } from "@std/streams";
import type { Quad, Term } from "oxigraph";
import { Store } from "oxigraph";
import type { OxigraphService } from "#/oxigraph/oxigraph-service.ts";
import type { DecodableEncoding } from "#/oxigraph/oxigraph-encoding.ts";
import {
  decodableEncodings,
  decodeStore,
  encodeStore,
} from "#/oxigraph/oxigraph-encoding.ts";

/**
 * DenoKvOxigraphService implements OxigraphService using `Deno.Kv`.
 */
export class DenoKvOxigraphService implements OxigraphService {
  public constructor(
    private readonly kv: Deno.Kv,
    private readonly prefix: Deno.KvKey = ["stores"],
    private readonly storageEncoding: DecodableEncoding = decodableEncodings.nq,
    private readonly compressionFormat: CompressionFormat = "gzip",
    //
    // TODO: Add encryption support.
  ) {}

  private storeKey(id: Deno.KvKeyPart): Deno.KvKey {
    return [...this.prefix, id];
  }

  public async getStore(
    id: string,
  ): Promise<Store | null> {
    const result = await this.kv.get<Uint8Array>(this.storeKey(id));
    if (result.value === null) {
      return null;
    }

    // Convert the stored Uint8Array back into a stream for the decoder
    const stream = ReadableStream.from([result.value]);

    const store = await decodeStore(
      stream,
      this.storageEncoding,
      new DecompressionStream(this.compressionFormat),
    );

    return store;
  }

  public async setStore(
    id: string,
    store: Store,
  ): Promise<void> {
    // 1. Get the stream from the encoder
    const stream = encodeStore(
      store,
      this.storageEncoding,
      new CompressionStream(this.compressionFormat),
    );

    // 2. Consume the stream into a Uint8Array
    const encodedBuffer = new Uint8Array(await toArrayBuffer(stream));

    // 3. Perform atomic update
    await this.kv.set(this.storeKey(id), encodedBuffer);
  }

  public async addQuads(id: string, quads: Quad[]): Promise<void> {
    // 1. Get existing store (or new)
    const store = await this.getStore(id) ?? (new Store());

    // 2. Add quads
    for (const quad of quads) {
      store.add(quad);
    }

    // 3. Save
    await this.setStore(id, store);
  }

  public async query(
    id: string,
    query: string,
  ): Promise<boolean | Map<string, Term>[] | Quad[] | string> {
    const store = await this.getStore(id);
    if (!store) {
      throw new Error("Store not found");
    }

    return store.query(query);
  }

  public async update(id: string, query: string): Promise<void> {
    const store = await this.getStore(id);
    if (!store) {
      throw new Error("Store not found");
    }

    store.update(query);
    await this.setStore(id, store);
  }

  public async removeStore(id: string): Promise<void> {
    await this.kv.delete(this.storeKey(id));
  }
}
