import cron from "node-cron";
import { createClient } from "@supabase/supabase-js";
import { syncPlaidItem, recordNetWorthSnapshotForUser } from "./sync";

interface PlaidItemRow {
  id: string;
  user_id: string;
  access_token: string;
  cursor: string | null;
}

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
    const { data: plaidItems, error: fetchError } = await supabase
      .from("plaid_items")
      .select("id, user_id, access_token, cursor")
      .returns<PlaidItemRow[]>();

    if (fetchError) {
      console.error("[Cron] Error fetching plaid items:", fetchError);
      return;
    }

    if (!plaidItems || plaidItems.length === 0) {
      console.log("[Cron] No plaid items to sync");
      return;
    }

    console.log(`[Cron] Syncing ${plaidItems.length} plaid items...`);

    let successful = 0;
    let failed = 0;

    for (const item of plaidItems) {
      try {
        const result = await syncPlaidItem(supabase, item, "automatic");
        if (result.success) {
          successful++;
          console.log(
            `[Cron] Synced item ${item.id}: +${result.added} -${result.removed} ~${result.modified}`
          );
        } else {
          failed++;
          console.error(`[Cron] Failed to sync item ${item.id}:`, result.error);
        }
      } catch (err) {
        failed++;
        console.error(`[Cron] Error syncing item ${item.id}:`, err);
      }
    }

    console.log(`[Cron] Sync complete. Successful: ${successful}, Failed: ${failed}`);

    // Record net worth snapshots for all users that were synced
    const userIds = [...new Set(plaidItems.map((item) => item.user_id))];
    console.log(`[Cron] Recording net worth for ${userIds.length} users...`);

    for (const userId of userIds) {
      await recordNetWorthSnapshotForUser(supabase, userId);
    }

    console.log("[Cron] Net worth snapshots recorded");
  } catch (error) {
    console.error("[Cron] Unexpected error during sync:", error);
  }
}

export function schedulePlaidSync() {
  // Run every 6 hours: at minute 0 of hours 0, 6, 12, 18
  cron.schedule("0 */6 * * *", runSync);

  console.log("[Cron] Plaid sync scheduled (every 6 hours)");
}
