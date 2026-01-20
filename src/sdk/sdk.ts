import type { WorldsOptions } from "./types.ts";
import { Worlds } from "./worlds.ts";
import { Conversations } from "./conversations.ts";
import { Messages } from "./messages.ts";

export class WorldsSdk {
  public readonly worlds: Worlds;
  public readonly conversations: Conversations;
  public readonly messages: Messages;

  public constructor(options: WorldsOptions) {
    this.worlds = new Worlds(options);
    this.conversations = new Conversations(options);
    this.messages = new Messages(options);
  }
}
