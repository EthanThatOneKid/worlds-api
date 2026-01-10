import { getAsBlob, set } from "@kitsonk/kv-toolbox/blob";

// TODO: Migrate to Kvdex blob storage
// https://github.com/oliver-oloughlin/kvdex?tab=readme-ov-file#blob-storage
//

/**
 * setWorldAsBlob sets a world as a blob.
 */
export async function setWorldAsBlob(
  kv: Deno.Kv,
  worldId: string,
  blob: Blob,
): Promise<void> {
  const result = await set(kv, worldKey(worldId), blob);
  if (!result.ok) {
    throw new Error(`Failed to set world ${worldId}`);
  }
}

/**
 * getWorldAsBlob gets a world as a blob.
 */
export function getWorldAsBlob(
  kv: Deno.Kv,
  worldId: string,
): Promise<Blob | null> {
  return getAsBlob(kv, worldKey(worldId));
}

function worldKey(worldId: string): Deno.KvKey {
  return ["worlds_blobs", worldId];
}
