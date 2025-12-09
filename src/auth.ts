import type { ApiKeysService } from "#/api-keys/api-keys-service.ts";

export async function auth(
  request: Request,
  options?: {
    storeId: string;
    apiKeys: ApiKeysService;
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

  // Check if token matches the owner API_KEY (grants access to all stores)
  if (token === Deno.env.get("API_KEY")) {
    return true;
  }

  // Check if token has access to the requested store
  if (options) {
    const authorizedStoreId = await options.apiKeys.get(token);
    return authorizedStoreId === options.storeId;
  }

  return false;
}
