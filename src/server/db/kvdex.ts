import { z } from "zod";
import { collection, kvdex } from "@olli/kvdex";
import { jsonEncoder } from "@olli/kvdex/encoding/json";

// TODO: Migrate kvdex collextions to sqlite tables.

/**
 * WorldsKvdex is the type of the kvdex for the Worlds API.
 */
export type WorldsKvdex = ReturnType<typeof createWorldsKvdex>;

/**
 * createWorldsKvdex returns the kvdex instance for the Worlds API.
 *
 * @see https://github.com/oliver-oloughlin/kvdex
 */
export function createWorldsKvdex(kv: Deno.Kv) {
  return kvdex({
    kv: kv,
    schema: {
      accounts: collection(accountSchema, {
        idGenerator: (account) => account.id,
        indices: {
          apiKey: "secondary",
        },
      }),
      tokenBuckets: collection(tokenBucketSchema),
      worlds: collection(worldSchema, {
        indices: {
          accountId: "secondary",
        },
      }),
      worldBlobs: collection(worldBlobSchema, {
        encoder: jsonEncoder(),
      }),
      conversations: collection(conversationSchema, {
        indices: {
          worldId: "secondary",
        },
      }),
      messages: collection(messageSchema, {
        indices: {
          conversationId: "secondary",
        },
      }),
    },
  });
}

export type Account = z.infer<typeof accountSchema>;

/**
 * accountSchema is the schema for an account.
 *
 * An account owns 0 or more worlds.
 */
export const accountSchema = z.object({
  id: z.string(),
  description: z.string().nullish(),
  plan: z.string().nullish(),
  apiKey: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
  deletedAt: z.number().nullish(),
});

export type World = z.infer<typeof worldSchema>;

// TODO: Make accountId on worldSchema nullable to support admin-created
// (non-account scoped) worlds.

/**
 * worldSchema is the schema for a world.
 *
 * A world is owned by an account.
 */
export const worldSchema = z.object({
  accountId: z.string(),
  label: z.string(),
  description: z.string().nullish(),
  createdAt: z.number(),
  updatedAt: z.number(),
  deletedAt: z.number().nullish(),
  isPublic: z.boolean().nullish().default(false),
});

export type TokenBucket = z.infer<typeof tokenBucketSchema>;

/**
 * tokenBucketSchema is the schema for a token bucket.
 *
 * A token bucket implements the [Token Bucket](https://en.wikipedia.org/wiki/Token_bucket)
 * algorithm for rate limiting.
 */
export const tokenBucketSchema = z.object({
  accountId: z.string(),
  key: z.string(), // Composite key: worldId:resourceType
  tokens: z.number(),
  lastRefillAt: z.number(),
});

export type WorldBlob = z.infer<typeof worldBlobSchema>;

/**
 * worldBlobSchema is the schema for a world blob.
 *
 * A world blob is an RDF dataset encoded as a binary blob of data
 * associated with a world.
 */
export const worldBlobSchema = z.instanceof(Uint8Array);

/**
 * Conversation is the type of a conversation.
 */
export type Conversation = z.infer<typeof conversationSchema>;

/**
 * conversationSchema is the schema for a conversation.
 *
 * A conversation is a series of messages in a world.
 */
export const conversationSchema = z.object({
  id: z.string(),
  worldId: z.string(),
  label: z.string().nullish(),
  createdAt: z.number(),
  updatedAt: z.number(),
  metadata: z.any().nullish(),
});

/**
 * textPartSchema is the schema for a text part of a message.
 */
const textPartSchema = z.object({
  type: z.literal("text"),
  text: z.string(),
});

/**
 * imagePartSchema is the schema for an image part of a message.
 */
const imagePartSchema = z.object({
  type: z.literal("image"),
  image: z.union([z.string(), z.instanceof(Uint8Array)]),
  mimeType: z.string().optional(),
});

/**
 * filePartSchema is the schema for a file part of a message.
 */
const filePartSchema = z.object({
  type: z.literal("file"),
  data: z.union([z.string(), z.instanceof(Uint8Array)]),
  mimeType: z.string(),
});

/**
 * toolCallPartSchema is the schema for a tool call part of a message.
 */
const toolCallPartSchema = z.object({
  type: z.literal("tool-call"),
  toolCallId: z.string(),
  toolName: z.string(),
  args: z.any(),
});

/**
 * toolResultPartSchema is the schema for a tool result part of a message.
 */
const toolResultPartSchema = z.object({
  type: z.literal("tool-result"),
  toolCallId: z.string(),
  toolName: z.string(),
  result: z.any(),
  isError: z.boolean().optional(),
});

/**
 * modelMessageSchema is the schema for a model message.
 *
 * A message can be from the system, user, assistant, or a tool.
 */
const modelMessageSchema = z.union([
  z.object({
    role: z.literal("system"),
    content: z.string(),
  }),
  z.object({
    role: z.literal("user"),
    content: z.union([
      z.string(),
      z.array(z.union([textPartSchema, imagePartSchema, filePartSchema])),
    ]),
  }),
  z.object({
    role: z.literal("assistant"),
    content: z.union([
      z.string(),
      z.array(z.union([textPartSchema, toolCallPartSchema])),
    ]).optional().nullable(),
  }),
  z.object({
    role: z.literal("tool"),
    content: z.array(toolResultPartSchema),
  }),
]);

/**
 * Message is the type of a message.
 */
export type Message = z.infer<typeof messageSchema>;

/**
 * messageSchema is the schema for a message.
 *
 * A message belongs to a conversation in a world.
 */
export const messageSchema = z.object({
  id: z.string(),
  worldId: z.string(),
  conversationId: z.string(),
  content: modelMessageSchema,
  createdAt: z.number(),
});
