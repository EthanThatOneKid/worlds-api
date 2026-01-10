// @deno-types="@types/n3"
import { Parser, Store, Writer } from "n3";
import { getWorldAsBlob, setWorldAsBlob } from "./blob.ts";

/**
 * getWorldAsN3Store gets a world as an N3 Store.
 */
export async function getWorldAsN3Store(
  kv: Deno.Kv,
  worldId: string,
): Promise<Store> {
  const worldBlob = await getWorldAsBlob(kv, worldId) ??
    new Blob([], { type: "application/n-quads" });
  const worldString = await worldBlob.text();
  const parser = new Parser({ format: "N-Quads" });
  const quads = parser.parse(worldString);
  const store = new Store();
  store.addQuads(quads);
  return store;
}

/**
 * setWorldAsN3Store sets a world as an N3 Store.
 */
export async function setWorldAsN3Store(
  kv: Deno.Kv,
  worldId: string,
  store: Store,
): Promise<void> {
  const writer = new Writer({ format: "N-Quads" });
  writer.addQuads(store.getQuads(null, null, null, null));
  const nQuadsString = await new Promise<string>((resolve, reject) => {
    writer.end((error, result) => {
      if (error) reject(error);
      else resolve(result as string);
    });
  });
  const worldBlob = new Blob([nQuadsString], {
    type: "application/n-quads",
  });
  await setWorldAsBlob(kv, worldId, worldBlob);
}
