import type { Client } from "@libsql/client";
import { createClient } from "@libsql/client";

export type { Client };

/**
 * openDatabase opens a SQLite database using LibSQL client.
 */
export async function openDatabase(url: string): Promise<Client> {
  const client = createClient({ url });

  // Enable foreign keys
  await client.execute("PRAGMA foreign_keys = ON;");

  // Recursive triggers for cascading deletes (e.g. blank nodes)
  await client.execute("PRAGMA recursive_triggers = ON;");

  return client;
}
