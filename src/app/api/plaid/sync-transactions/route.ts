import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncAllItemsForUser, recordNetWorthSnapshotForUser } from "@/lib/plaid/sync";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Sync all items for the user (manual trigger)
    const result = await syncAllItemsForUser(supabase, user.id, "manual");

    if (!result.success) {
      return NextResponse.json(
        { error: result.errors.join("; ") || "Failed to sync transactions" },
        { status: 500 }
      );
    }

    // Record net worth snapshot after successful sync
    await recordNetWorthSnapshotForUser(supabase, user.id);

    return NextResponse.json({
      success: true,
      itemsSynced: result.itemsSynced,
      added: result.totalAdded,
      modified: result.totalModified,
      removed: result.totalRemoved,
      balancesUpdated: result.totalBalancesUpdated,
    });
  } catch (error) {
    console.error("Error syncing transactions:", error);
    return NextResponse.json(
      { error: "Failed to sync transactions" },
      { status: 500 }
    );
  }
}
