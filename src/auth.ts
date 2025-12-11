import type { AccountsService } from "#/accounts/accounts-service.ts";
import { authorize } from "#/accounts/authorize.ts";

export async function auth(
  request: Request,
  options?: {
    storeId: string;
    accounts: AccountsService;
  },
): Promise<boolean> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return false;
  }

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) {
    return false;
  }

  // Check if token matches the owner ADMIN_ACCOUNT_ID (grants access to all stores)
  if (token === Deno.env.get("ADMIN_ACCOUNT_ID")) {
    return true;
  }

  // Check if token has access to the requested store
  if (options) {
    try {
      const account = await authorize(options.accounts, token);
      if (!account) {
        return false;
      }
      return account.accessControl.stores.includes(options.storeId);
    } catch {
      return false;
    }
  }

  return false;
}
