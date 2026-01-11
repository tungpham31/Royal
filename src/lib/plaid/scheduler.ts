import cron from "node-cron";
import { createClient } from "@supabase/supabase-js";
import { syncAllItemsForUser, recordNetWorthSnapshotForUser } from "./sync";

async function runSync() {
  console.log("[Cron] Starting scheduled Plaid sync...");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("[Cron] Supabase credentials not configured");
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Get unique user IDs from plaid_items
    const { data: plaidItems, error: fetchError } = await supabase
      .from("plaid_items")
      .select("user_id")
      .returns<{ user_id: string }[]>();

    if (fetchError) {
      console.error("[Cron] Error fetching plaid items:", fetchError);
      return;
    }

    if (!plaidItems || plaidItems.length === 0) {
      console.log("[Cron] No plaid items to sync");
      return;
    }

    // Get unique user IDs
    const userIds = [...new Set(plaidItems.map((item) => item.user_id))];
    console.log(`[Cron] Syncing for ${userIds.length} users...`);

    let usersSuccessful = 0;
    let usersFailed = 0;

    for (const userId of userIds) {
      const result = await syncAllItemsForUser(supabase, userId, "automatic");
      if (result.success) {
        usersSuccessful++;
        console.log(
          `[Cron] Synced user ${userId}: ${result.itemsSynced} items, +${result.totalAdded} -${result.totalRemoved} ~${result.totalModified}`
        );
      } else {
        usersFailed++;
        console.error(`[Cron] Failed to sync user ${userId}:`, result.errors);
      }

      // Record net worth snapshot after sync
      await recordNetWorthSnapshotForUser(supabase, userId);
    }

    console.log(`[Cron] Sync complete. Users successful: ${usersSuccessful}, failed: ${usersFailed}`);
  } catch (error) {
    console.error("[Cron] Unexpected error during sync:", error);
  }
}

export function schedulePlaidSync() {
  // Run every 6 hours: at minute 0 of hours 0, 6, 12, 18
  cron.schedule("0 */6 * * *", runSync);

  console.log("[Cron] Plaid sync scheduled (every 6 hours)");
}
