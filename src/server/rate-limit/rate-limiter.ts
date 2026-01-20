import type { TokenBucket } from "#/server/db/kvdex.ts";
import type {
  RateLimiter,
  RateLimitPolicy,
  RateLimitResult,
} from "./interfaces.ts";

/**
 * TokenBucketRateLimiter implements the Token Bucket algorithm for rate limiting.
 */
export class TokenBucketRateLimiter implements RateLimiter {
  constructor(private kv: Deno.Kv) {}

  /**
   * consume attempts to consume tokens from a bucket.
   * Implements the Token Bucket algorithm with atomic operations.
   */
  async consume(
    key: string,
    cost: number,
    policy: RateLimitPolicy,
  ): Promise<RateLimitResult> {
    const kvKey = ["tokenBuckets", key];

    // Retry loop for atomic operations
    const maxRetries = 10;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const now = Date.now();

      // Try to get existing bucket
      const entry = await this.kv.get<TokenBucket>(kvKey);
      const existing = entry.value;

      let tokens: number;
      let lastRefillAt: number;

      if (existing) {
        // Calculate tokens to add based on time elapsed
        const timeSinceRefill = now - existing.lastRefillAt;
        const intervalsElapsed = Math.floor(timeSinceRefill / policy.interval);
        const tokensToAdd = intervalsElapsed * policy.refillRate;

        // Refill tokens, but don't exceed capacity
        tokens = Math.min(existing.tokens + tokensToAdd, policy.capacity);
        lastRefillAt = existing.lastRefillAt +
          (intervalsElapsed * policy.interval);
      } else {
        // New bucket starts at full capacity
        tokens = policy.capacity;
        lastRefillAt = now;
      }

      // Check if we have enough tokens
      const allowed = tokens >= cost;

      // Calculate reset time (when next token will be available)
      let reset: number;
      if (allowed) {
        tokens -= cost;
        reset = lastRefillAt + policy.interval;
      } else {
        const tokensNeeded = cost - tokens;
        const intervalsNeeded = Math.ceil(tokensNeeded / policy.refillRate);
        reset = lastRefillAt + (intervalsNeeded * policy.interval);
      }

      // Only update bucket if request is allowed
      if (allowed) {
        const nextValue: TokenBucket = {
          accountId: key.split(":")[0], // Extract accountId from key
          key,
          tokens,
          lastRefillAt,
        };

        const atomicOperation = this.kv.atomic().check(entry).set(
          kvKey,
          nextValue,
        );

        const result = await atomicOperation.commit();

        // If atomic operation failed, retry
        if (!result.ok) {
          continue;
        }
      }

      return {
        allowed,
        remaining: Math.floor(tokens),
        reset,
      };
    }

    // If we exhausted retries, throw an error
    throw new Error("Rate limit check failed after maximum retries");
  }
}
