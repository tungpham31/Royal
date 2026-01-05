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

    const { plaid_item_id } = await request.json();

    // Get the Plaid item
    interface PlaidItemRow {
      id: string;
      user_id: string;
      plaid_item_id: string;
      access_token: string;
      cursor: string | null;
    }
    const { data: plaidItem, error: itemError } = await supabase
      .from("plaid_items")
      .select("*")
      .eq("id", plaid_item_id)
      .eq("user_id", user.id)
      .single()
      .then((res) => ({ ...res, data: res.data as PlaidItemRow | null }));

    if (itemError || !plaidItem) {
      return NextResponse.json({ error: "Plaid item not found" }, { status: 404 });
    }

    // Use cursor for incremental sync
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

      console.log(`Sync response: added=${added.length}, modified=${modified.length}, removed=${removed.length}, has_more=${has_more}`);

      // Get user's accounts for this Plaid item
      const { data: accounts } = await supabase
        .from("accounts")
        .select("id, plaid_account_id")
        .eq("plaid_item_id", plaid_item_id)
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

            // Get logo from counterparties (Plaid provides merchant logos here)
            const logoUrl = txn.counterparties?.[0]?.logo_url || null;

            return {
              user_id: user.id,
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

        // Get logo from counterparties
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
      .eq("id", plaid_item_id);

    // Also sync account balances
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
          .eq("plaid_item_id", plaid_item_id);

        if (!balanceError) {
          balancesUpdated++;
        }
      }
      console.log(`Balance sync: updated ${balancesUpdated} accounts`);
    } catch (balanceError) {
      console.error("Error syncing balances:", balanceError);
    }

    return NextResponse.json({
      success: true,
      added: addedCount,
      modified: modifiedCount,
      removed: removedCount,
      balancesUpdated,
    });
  } catch (error) {
    console.error("Error syncing transactions:", error);
    return NextResponse.json(
      { error: "Failed to sync transactions" },
      { status: 500 }
    );
  }
}
