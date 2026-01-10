import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { syncPlaidItem } from "@/lib/plaid/sync";

interface PlaidItemRow {
  id: string;
  user_id: string;
  access_token: string;
  cursor: string | null;
}

export async function POST(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("[Cron Sync] CRON_SECRET not configured");
    return NextResponse.json(
      { error: "Cron not configured" },
      { status: 500 }
    );
  }

  const providedSecret = authHeader?.replace("Bearer ", "");
  if (providedSecret !== cronSecret) {
    console.warn("[Cron Sync] Unauthorized attempt");
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Create admin Supabase client (bypasses RLS)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("[Cron Sync] Supabase credentials not configured");
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Fetch all Plaid items
    const { data: plaidItems, error: fetchError } = await supabase
      .from("plaid_items")
      .select("id, user_id, access_token, cursor")
      .returns<PlaidItemRow[]>();

    if (fetchError) {
      console.error("[Cron Sync] Error fetching plaid items:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch plaid items" },
        { status: 500 }
      );
    }

    if (!plaidItems || plaidItems.length === 0) {
      console.log("[Cron Sync] No plaid items to sync");
      return NextResponse.json({
        success: true,
        message: "No plaid items to sync",
        results: [],
      });
    }

    console.log(`[Cron Sync] Starting sync for ${plaidItems.length} items`);

    // Sync each item
    const results = await Promise.allSettled(
      plaidItems.map(async (item) => {
        const result = await syncPlaidItem(supabase, item);
        return {
          plaidItemId: item.id,
          userId: item.user_id,
          ...result,
        };
      })
    );

    // Process results
    const summary = {
      total: results.length,
      successful: 0,
      failed: 0,
      totalAdded: 0,
      totalModified: 0,
      totalRemoved: 0,
      totalBalancesUpdated: 0,
      errors: [] as { plaidItemId: string; error: string }[],
    };

    results.forEach((result) => {
      if (result.status === "fulfilled") {
        if (result.value.success) {
          summary.successful++;
          summary.totalAdded += result.value.added;
          summary.totalModified += result.value.modified;
          summary.totalRemoved += result.value.removed;
          summary.totalBalancesUpdated += result.value.balancesUpdated;
        } else {
          summary.failed++;
          summary.errors.push({
            plaidItemId: result.value.plaidItemId,
            error: result.value.error || "Unknown error",
          });
        }
      } else {
        summary.failed++;
        summary.errors.push({
          plaidItemId: "unknown",
          error: result.reason?.message || "Promise rejected",
        });
      }
    });

    console.log("[Cron Sync] Completed:", summary);

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error("[Cron Sync] Unexpected error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
