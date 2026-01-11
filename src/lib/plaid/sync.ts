import { plaidClient } from "@/lib/plaid/client";
import { SupabaseClient } from "@supabase/supabase-js";

interface SyncResult {
  success: boolean;
  added: number;
  modified: number;
  removed: number;
  balancesUpdated: number;
  error?: string;
}

export type TriggerType = "manual" | "automatic";

interface SyncHistoryRecord {
  userId: string;
  triggerType: TriggerType;
  status: "success" | "failed";
  transactionsAdded: number;
  transactionsModified: number;
  transactionsRemoved: number;
  balancesUpdated: number;
  errorMessage?: string;
  startedAt: Date;
  completedAt: Date;
}

/**
 * Record sync history in the database (one entry per user per sync)
 */
async function recordSyncHistory(
  supabase: SupabaseClient,
  record: SyncHistoryRecord
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("sync_history").insert({
    user_id: record.userId,
    trigger_type: record.triggerType,
    status: record.status,
    transactions_added: record.transactionsAdded,
    transactions_modified: record.transactionsModified,
    transactions_removed: record.transactionsRemoved,
    balances_updated: record.balancesUpdated,
    error_message: record.errorMessage,
    started_at: record.startedAt.toISOString(),
    completed_at: record.completedAt.toISOString(),
  });

  if (error) {
    console.error(`[SyncHistory] Error recording sync history:`, error);
  }
}

interface PlaidItem {
  id: string;
  user_id: string;
  access_token: string;
  cursor: string | null;
}

/**
 * Sync transactions and balances for a single Plaid item
 * Note: Does not record sync history - use syncAllItemsForUser for that
 */
export async function syncPlaidItem(
  supabase: SupabaseClient,
  plaidItem: PlaidItem
): Promise<SyncResult> {
  try {
    let cursor = plaidItem.cursor;
    let hasMore = true;
    let addedCount = 0;
    let modifiedCount = 0;
    let removedCount = 0;

    while (hasMore) {
      const response = await plaidClient.transactionsSync({
        access_token: plaidItem.access_token,
        cursor: cursor || undefined,
      });

      const { added, modified, removed, next_cursor, has_more } = response.data;

      console.log(
        `[Sync ${plaidItem.id}] added=${added.length}, modified=${modified.length}, removed=${removed.length}`
      );

      // Get user's accounts for this Plaid item
      const { data: accounts } = await supabase
        .from("accounts")
        .select("id, plaid_account_id")
        .eq("plaid_item_id", plaidItem.id)
        .returns<{ id: string; plaid_account_id: string }[]>();

      const accountMap = new Map(
        (accounts || []).map((a) => [a.plaid_account_id, a.id])
      );

      // Process added transactions
      if (added.length > 0) {
        const transactionsToInsert = added
          .map((txn) => {
            const accountId = accountMap.get(txn.account_id);
            if (!accountId) return null;

            const logoUrl = txn.counterparties?.[0]?.logo_url || null;

            return {
              user_id: plaidItem.user_id,
              account_id: accountId,
              plaid_transaction_id: txn.transaction_id,
              amount: txn.amount,
              date: txn.date,
              name: txn.name,
              merchant_name: txn.merchant_name,
              pending: txn.pending,
              plaid_category_primary: txn.personal_finance_category?.primary || null,
              plaid_category_detailed: txn.personal_finance_category?.detailed || null,
              logo_url: logoUrl,
            };
          })
          .filter(Boolean);

        if (transactionsToInsert.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: insertError } = await (supabase as any)
            .from("transactions")
            .upsert(transactionsToInsert, {
              onConflict: "plaid_transaction_id",
            });

          if (insertError) {
            console.error("Error inserting transactions:", insertError);
          } else {
            addedCount += transactionsToInsert.length;
          }
        }
      }

      // Process modified transactions
      for (const txn of modified) {
        const accountId = accountMap.get(txn.account_id);
        if (!accountId) continue;

        const logoUrl = txn.counterparties?.[0]?.logo_url || null;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: updateError } = await (supabase as any)
          .from("transactions")
          .update({
            amount: txn.amount,
            date: txn.date,
            name: txn.name,
            merchant_name: txn.merchant_name,
            pending: txn.pending,
            plaid_category_primary: txn.personal_finance_category?.primary || null,
            plaid_category_detailed: txn.personal_finance_category?.detailed || null,
            logo_url: logoUrl,
          })
          .eq("plaid_transaction_id", txn.transaction_id);

        if (!updateError) {
          modifiedCount++;
        }
      }

      // Process removed transactions
      for (const txn of removed) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: deleteError } = await (supabase as any)
          .from("transactions")
          .delete()
          .eq("plaid_transaction_id", txn.transaction_id);

        if (!deleteError) {
          removedCount++;
        }
      }

      cursor = next_cursor;
      hasMore = has_more;
    }

    // Update cursor on Plaid item
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("plaid_items")
      .update({ cursor, last_synced_at: new Date().toISOString() })
      .eq("id", plaidItem.id);

    // Sync account balances
    let balancesUpdated = 0;
    try {
      const balanceResponse = await plaidClient.accountsBalanceGet({
        access_token: plaidItem.access_token,
      });

      for (const account of balanceResponse.data.accounts) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: balanceError } = await (supabase as any)
          .from("accounts")
          .update({
            current_balance: account.balances.current,
            available_balance: account.balances.available,
            last_balance_update: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("plaid_account_id", account.account_id)
          .eq("plaid_item_id", plaidItem.id);

        if (!balanceError) {
          balancesUpdated++;
        }
      }
    } catch (balanceError) {
      console.error(`[Sync ${plaidItem.id}] Error syncing balances:`, balanceError);
    }

    return {
      success: true,
      added: addedCount,
      modified: modifiedCount,
      removed: removedCount,
      balancesUpdated,
    };
  } catch (error) {
    console.error(`[Sync ${plaidItem.id}] Error:`, error);
    return {
      success: false,
      added: 0,
      modified: 0,
      removed: 0,
      balancesUpdated: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

interface UserSyncResult {
  success: boolean;
  itemsSynced: number;
  itemsFailed: number;
  totalAdded: number;
  totalModified: number;
  totalRemoved: number;
  totalBalancesUpdated: number;
  errors: string[];
}

/**
 * Sync all Plaid items for a user and record one sync history entry
 */
export async function syncAllItemsForUser(
  supabase: SupabaseClient,
  userId: string,
  triggerType: TriggerType
): Promise<UserSyncResult> {
  const startedAt = new Date();

  // Fetch all Plaid items for this user
  const { data: plaidItems, error: fetchError } = await supabase
    .from("plaid_items")
    .select("id, user_id, access_token, cursor")
    .eq("user_id", userId)
    .returns<PlaidItem[]>();

  if (fetchError) {
    console.error(`[SyncUser ${userId}] Error fetching plaid items:`, fetchError);
    const completedAt = new Date();
    await recordSyncHistory(supabase, {
      userId,
      triggerType,
      status: "failed",
      transactionsAdded: 0,
      transactionsModified: 0,
      transactionsRemoved: 0,
      balancesUpdated: 0,
      errorMessage: fetchError.message,
      startedAt,
      completedAt,
    });
    return {
      success: false,
      itemsSynced: 0,
      itemsFailed: 0,
      totalAdded: 0,
      totalModified: 0,
      totalRemoved: 0,
      totalBalancesUpdated: 0,
      errors: [fetchError.message],
    };
  }

  if (!plaidItems || plaidItems.length === 0) {
    console.log(`[SyncUser ${userId}] No plaid items to sync`);
    const completedAt = new Date();
    await recordSyncHistory(supabase, {
      userId,
      triggerType,
      status: "success",
      transactionsAdded: 0,
      transactionsModified: 0,
      transactionsRemoved: 0,
      balancesUpdated: 0,
      startedAt,
      completedAt,
    });
    return {
      success: true,
      itemsSynced: 0,
      itemsFailed: 0,
      totalAdded: 0,
      totalModified: 0,
      totalRemoved: 0,
      totalBalancesUpdated: 0,
      errors: [],
    };
  }

  // Sync all items and aggregate results
  let itemsSynced = 0;
  let itemsFailed = 0;
  let totalAdded = 0;
  let totalModified = 0;
  let totalRemoved = 0;
  let totalBalancesUpdated = 0;
  const errors: string[] = [];

  for (const item of plaidItems) {
    const result = await syncPlaidItem(supabase, item);
    if (result.success) {
      itemsSynced++;
      totalAdded += result.added;
      totalModified += result.modified;
      totalRemoved += result.removed;
      totalBalancesUpdated += result.balancesUpdated;
    } else {
      itemsFailed++;
      if (result.error) {
        errors.push(`Item ${item.id}: ${result.error}`);
      }
    }
  }

  const completedAt = new Date();
  const overallSuccess = itemsFailed === 0;

  // Record one sync history entry for the user
  await recordSyncHistory(supabase, {
    userId,
    triggerType,
    status: overallSuccess ? "success" : "failed",
    transactionsAdded: totalAdded,
    transactionsModified: totalModified,
    transactionsRemoved: totalRemoved,
    balancesUpdated: totalBalancesUpdated,
    errorMessage: errors.length > 0 ? errors.join("; ") : undefined,
    startedAt,
    completedAt,
  });

  console.log(
    `[SyncUser ${userId}] Completed: ${itemsSynced} synced, ${itemsFailed} failed, +${totalAdded} -${totalRemoved} ~${totalModified}`
  );

  return {
    success: overallSuccess,
    itemsSynced,
    itemsFailed,
    totalAdded,
    totalModified,
    totalRemoved,
    totalBalancesUpdated,
    errors,
  };
}

/**
 * Record a net worth snapshot for a user
 * Uses upsert to ensure only one record per user per day (UTC)
 */
export async function recordNetWorthSnapshotForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get all accounts for this user
    const { data: accounts, error: fetchError } = await supabase
      .from("accounts")
      .select("type, current_balance")
      .eq("user_id", userId)
      .returns<{ type: string; current_balance: number | null }[]>();

    if (fetchError) {
      console.error(`[NetWorth ${userId}] Error fetching accounts:`, fetchError);
      return { success: false, error: fetchError.message };
    }

    let totalAssets = 0;
    let totalLiabilities = 0;

    (accounts || []).forEach((account) => {
      const balance = account.current_balance || 0;
      if (account.type === "credit" || account.type === "loan") {
        totalLiabilities += Math.abs(balance);
      } else {
        totalAssets += balance;
      }
    });

    const today = new Date().toISOString().split("T")[0];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: upsertError } = await (supabase as any)
      .from("net_worth_history")
      .upsert(
        {
          user_id: userId,
          date: today,
          total_assets: totalAssets,
          total_liabilities: totalLiabilities,
          net_worth: totalAssets - totalLiabilities,
        },
        { onConflict: "user_id,date" }
      );

    if (upsertError) {
      console.error(`[NetWorth ${userId}] Error upserting:`, upsertError);
      return { success: false, error: upsertError.message };
    }

    console.log(
      `[NetWorth ${userId}] Recorded: assets=${totalAssets}, liabilities=${totalLiabilities}, net=${totalAssets - totalLiabilities}`
    );
    return { success: true };
  } catch (error) {
    console.error(`[NetWorth ${userId}] Error:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
