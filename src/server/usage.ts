import type { AppContext } from "./app-context.ts";

/**
 * incrementRequestCount increments the request count for a world.
 */
export async function incrementRequestCount(
  appContext: AppContext,
  accountId: string,
  worldId: string,
): Promise<void> {
  const now = Date.now();
  const bucketStartTs = Math.floor(now / 60000) * 60000;

  // Use a consistent ID for the bucket based on worldId + time.
  // This allows O(1) lookup and atomic updates.
  const bucketId = `${worldId}_${bucketStartTs}`;
  const existing = await appContext.db.usageBuckets.find(bucketId);
  await appContext.db
    .atomic(({ usageBuckets }) => usageBuckets)
    .set(bucketId, {
      accountId,
      worldId,
      bucketStartTs,
      requestCount: (existing?.value.requestCount ?? 0) + 1,
    })
    .commit();
}
