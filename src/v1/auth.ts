import type { ApiKeysService } from "#/api-keys/api-keys-service.ts";

export async function auth(
  apiKeysService: ApiKeysService,
  request: Request,
): Promise<boolean> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }

  const token = authHeader.slice(7).trim();
  if (!token || !(await apiKeysService.has(token))) {
    return false;
  }

  return true;
}
