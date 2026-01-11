import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncPlaidItem, recordNetWorthSnapshotForUser } from "@/lib/plaid/sync";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plaid_item_id } = await request.json();

    // Get the Plaid item
    interface PlaidItemRow {
      id: string;
      user_id: string;
      access_token: string;
      cursor: string | null;
    }
    const { data: plaidItem, error: itemError } = await supabase
      .from("plaid_items")
      .select("id, user_id, access_token, cursor")
      .eq("id", plaid_item_id)
      .eq("user_id", user.id)
      .single<PlaidItemRow>();

    if (itemError || !plaidItem) {
      return NextResponse.json({ error: "Plaid item not found" }, { status: 404 });
    }

    // Use the shared sync logic (manual trigger)
    const result = await syncPlaidItem(supabase, plaidItem, "manual");

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to sync transactions" },
        { status: 500 }
      );
    }

    // Record net worth snapshot after successful sync
    await recordNetWorthSnapshotForUser(supabase, user.id);

    return NextResponse.json({
      success: true,
      added: result.added,
      modified: result.modified,
      removed: result.removed,
      balancesUpdated: result.balancesUpdated,
    });
  } catch (error) {
    console.error("Error syncing transactions:", error);
    return NextResponse.json(
      { error: "Failed to sync transactions" },
      { status: 500 }
    );
  }
}
