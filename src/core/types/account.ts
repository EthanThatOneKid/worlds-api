/**
 * Account represents a service account.
 */
export interface Account {
  /**
   * id is the unique ID of the account.
   */
  id: string;

  /**
   * apiKey is the secret key used to authenticate the account.
   */
  apiKey: string;

  /**
   * description is a user-defined description of the account.
   */
  description: string;

  /**
   * plan is the plan the account is on.
   */
  plan: AccountPlan;

  /**
   * accessControl is the access control list of resources for the account.
   */
  accessControl: AccountAccessControl;
}

/**
 * AccountPlan is the plan the account is on.
 */
export type AccountPlan = "free" | "pro";

/**
 * AccountAccessControl is the access control list of resources for an account.
 */
export interface AccountAccessControl {
  /**
   * worlds is a list of world IDs this account has access to.
   */
  worlds: string[];
}

/**
 * isAccount checks if the object is a Account.
 */
export function isAccount(obj: unknown): obj is Account {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }

  const account = obj as Account;
  if (typeof account.id !== "string") {
    return false;
  }

  if (typeof account.apiKey !== "string") {
    return false;
  }

  if (typeof account.description !== "string") {
    return false;
  }

  if (account.plan !== "free" && account.plan !== "pro") {
    return false;
  }

  if (
    typeof account.accessControl !== "object" ||
    account.accessControl === null
  ) {
    return false;
  }

  if (!Array.isArray(account.accessControl.worlds)) {
    return false;
  }

  if (account.accessControl.worlds.some((w) => typeof w !== "string")) {
    return false;
  }

  return true;
}
