import type { WorldsOptions } from "#/sdk/types.ts";
import { Worlds } from "#/sdk/worlds.ts";
import { Conversations } from "#/sdk/conversations.ts";
import { Messages } from "#/sdk/messages.ts";
import { Accounts } from "./accounts.ts";

/**
 * InternalWorldsSdk is a TypeScript SDK for internal-only operations
 * on the Worlds API.
 */
export class InternalWorldsSdk {
  public readonly accounts: Accounts;
  public readonly worlds: Worlds;
  public readonly conversations: Conversations;
  public readonly messages: Messages;

  public constructor(options: WorldsOptions) {
    // Initialize internal SDK modules.
    this.accounts = new Accounts(options);

    // Initialize public SDK modules.
    this.worlds = new Worlds(options);
    this.conversations = new Conversations(options);
    this.messages = new Messages(options);
  }
}
