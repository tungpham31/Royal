import { NextRequest, NextResponse } from "next/server";
import { plaidClient } from "@/lib/plaid/client";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { public_token, metadata } = await request.json();

    // Exchange public token for access token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token,
    });

    const accessToken = exchangeResponse.data.access_token;
    const itemId = exchangeResponse.data.item_id;

    // Get institution info
    const institutionId = metadata.institution?.institution_id;
    let institutionName = metadata.institution?.name || "Unknown Institution";

    // Store the Plaid item (connection)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: plaidItem, error: itemError } = await (supabase as any)
      .from("plaid_items")
      .insert({
        user_id: user.id,
        plaid_item_id: itemId,
        access_token: accessToken,
        institution_id: institutionId,
        institution_name: institutionName,
      })
      .select()
      .single();

    if (itemError) {
      console.error("Error storing Plaid item:", itemError);
      return NextResponse.json(
        { error: "Failed to store connection" },
        { status: 500 }
      );
    }

    // Fetch accounts from Plaid
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    // Store accounts in database
    const accountsToInsert = accountsResponse.data.accounts.map((account) => ({
      user_id: user.id,
      plaid_item_id: plaidItem.id,
      plaid_account_id: account.account_id,
      name: account.name,
      official_name: account.official_name,
      type: account.type,
      subtype: account.subtype,
      mask: account.mask,
      current_balance: account.balances.current,
      available_balance: account.balances.available,
      currency: account.balances.iso_currency_code || "USD",
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: accountsError } = await (supabase as any)
      .from("accounts")
      .insert(accountsToInsert);

    if (accountsError) {
      console.error("Error storing accounts:", accountsError);
      return NextResponse.json(
        { error: "Failed to store accounts" },
        { status: 500 }
      );
    }

    // Trigger initial transaction sync
    try {
      const syncResponse = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/plaid/sync-transactions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            cookie: request.headers.get("cookie") || "",
          },
          body: JSON.stringify({ plaid_item_id: plaidItem.id }),
        }
      );

      if (!syncResponse.ok) {
        console.error("Failed to sync transactions after linking");
      }
    } catch (syncError) {
      console.error("Error syncing transactions:", syncError);
    }

    return NextResponse.json({
      success: true,
      accounts_added: accountsToInsert.length,
      plaid_item_id: plaidItem.id,
    });
  } catch (error) {
    console.error("Error exchanging token:", error);
    return NextResponse.json(
      { error: "Failed to exchange token" },
      { status: 500 }
    );
  }
}
