import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plaid_item_id } = await request.json();

    // Reset the cursor to force a full re-sync
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("plaid_items")
      .update({ cursor: null })
      .eq("id", plaid_item_id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error resetting cursor:", error);
      return NextResponse.json({ error: "Failed to reset sync" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error resetting sync:", error);
    return NextResponse.json(
      { error: "Failed to reset sync" },
      { status: 500 }
    );
  }
}
