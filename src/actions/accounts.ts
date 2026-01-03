"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface AccountWithPlaidItem {
  id: string;
  user_id: string;
  plaid_item_id: string | null;
  plaid_account_id: string | null;
  name: string;
  official_name: string | null;
  mask: string | null;
  type: string;
  subtype: string | null;
  current_balance: number | null;
  available_balance: number | null;
  limit_amount: number | null;
  currency: string;
  is_manual: boolean;
  is_asset: boolean;
  include_in_net_worth: boolean;
  is_hidden: boolean;
  last_balance_update: string | null;
  created_at: string;
  updated_at: string;
  plaid_item?: { institution_name: string } | null;
}

export async function getAccounts() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { data: accounts, error } = await supabase
    .from("accounts")
    .select(`
      *,
      plaid_item:plaid_items(institution_name)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .returns<AccountWithPlaidItem[]>();

  if (error) {
    console.error("Error fetching accounts:", error);
    return { error: "Failed to fetch accounts" };
  }

  return { accounts };
}

interface AccountSummaryRow {
  type: string;
  current_balance: number | null;
}

export async function getAccountsSummary() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { data: accounts, error } = await supabase
    .from("accounts")
    .select("type, current_balance")
    .eq("user_id", user.id)
    .returns<AccountSummaryRow[]>();

  if (error) {
    return { error: "Failed to fetch accounts" };
  }

  const summary = {
    cash: 0,
    credit: 0,
    investment: 0,
    loan: 0,
    total: 0,
  };

  (accounts || []).forEach((account) => {
    const balance = account.current_balance || 0;

    switch (account.type) {
      case "depository":
        summary.cash += balance;
        break;
      case "credit":
        summary.credit += balance;
        break;
      case "investment":
        summary.investment += balance;
        break;
      case "loan":
        summary.loan += balance;
        break;
    }
  });

  summary.total = summary.cash + summary.investment - summary.credit - summary.loan;

  return { summary };
}

export async function refreshAccounts() {
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
}
