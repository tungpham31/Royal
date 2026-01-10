/**
 * Returns the display name for an account.
 * Uses nickname if set, otherwise falls back to the account name.
 */
export function getAccountDisplayName(account: {
  nickname?: string | null;
  name: string;
}): string {
  return account.nickname || account.name;
}
