import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { syncAllItemsForUser, recordNetWorthSnapshotForUser } from "@/lib/plaid/sync";

// Vercel cron configuration
export const dynamic = "force-dynamic";
export const maxDuration = 60; // Allow up to 60 seconds for sync

// GET handler for Vercel cron (which uses GET requests)
export async function GET(request: Request) {
  return handleCronSync(request);
}

// POST handler for manual/external triggers
export async function POST(request: Request) {
  return handleCronSync(request);
}

async function handleCronSync(request: Request) {
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
    // Get unique user IDs from plaid_items
    const { data: plaidItems, error: fetchError } = await supabase
      .from("plaid_items")
      .select("user_id")
      .returns<{ user_id: string }[]>();

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
        summary: { usersProcessed: 0 },
      });
    }

    // Get unique user IDs
    const userIds = [...new Set(plaidItems.map((item) => item.user_id))];
    console.log(`[Cron Sync] Starting sync for ${userIds.length} users`);

    // Sync each user (one history entry per user)
    const results = await Promise.allSettled(
      userIds.map(async (userId) => {
        const result = await syncAllItemsForUser(supabase, userId, "automatic");
        // Record net worth snapshot after sync
        await recordNetWorthSnapshotForUser(supabase, userId);
        return { userId, ...result };
      })
    );

    // Process results
    const summary = {
      usersProcessed: userIds.length,
      usersSuccessful: 0,
      usersFailed: 0,
      totalItemsSynced: 0,
      totalItemsFailed: 0,
      totalAdded: 0,
      totalModified: 0,
      totalRemoved: 0,
      totalBalancesUpdated: 0,
      errors: [] as { userId: string; error: string }[],
    };

    results.forEach((result) => {
      if (result.status === "fulfilled") {
        if (result.value.success) {
          summary.usersSuccessful++;
        } else {
          summary.usersFailed++;
          summary.errors.push({
            userId: result.value.userId,
            error: result.value.errors.join("; ") || "Unknown error",
          });
        }
        summary.totalItemsSynced += result.value.itemsSynced;
        summary.totalItemsFailed += result.value.itemsFailed;
        summary.totalAdded += result.value.totalAdded;
        summary.totalModified += result.value.totalModified;
        summary.totalRemoved += result.value.totalRemoved;
        summary.totalBalancesUpdated += result.value.totalBalancesUpdated;
      } else {
        summary.usersFailed++;
        summary.errors.push({
          userId: "unknown",
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
