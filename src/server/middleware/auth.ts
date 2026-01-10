import type { Account } from "#/server/db/kvdex.ts";
import type { AppContext } from "#/server/app-context.ts";

/**
 * AuthorizedRequest is the result of a successful authentication.
 */
export interface AuthorizedRequest {
  admin: boolean;
  account: {
    id: string;
    value: Account;
  } | null;
}

/**
 * authorizeRequest authorizes a request using Bearer token and associates
 * an account with the request.
 */
export async function authorizeRequest(
  appContext: AppContext,
  request: Request,
): Promise<AuthorizedRequest> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { admin: false, account: null };
  }

  const apiKey = authHeader.slice("Bearer ".length).trim();
  return await authorize(appContext, apiKey);
}

/**
 * authorize authorizes a request.
 */
export async function authorize(
  { db, admin }: AppContext,
  apiKey: string,
): Promise<AuthorizedRequest> {
  if (apiKey === admin?.apiKey) {
    return { admin: true, account: null };
  }

  const result = await db.accounts
    .getOneBySecondaryIndex("apiKey", apiKey);
  if (!result) {
    return { admin: false, account: null };
  }

  return {
    admin: false,
    account: { id: result.id, value: result.value },
  };
}
