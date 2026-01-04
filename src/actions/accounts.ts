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
  plaid_item?: { institution_name: string; institution_logo: string | null } | null;
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
      plaid_item:plaid_items(institution_name, institution_logo)
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

interface AccountDetail extends AccountWithPlaidItem {
  transactions?: {
    id: string;
    amount: number;
    date: string;
    name: string;
    merchant_name: string | null;
    category_id: string | null;
    pending: boolean;
  }[];
}

export async function getAccountById(accountId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Fetch account details
  const { data: account, error: accountError } = await supabase
    .from("accounts")
    .select(`
      *,
      plaid_item:plaid_items(institution_name, institution_logo)
    `)
    .eq("id", accountId)
    .eq("user_id", user.id)
    .single<AccountWithPlaidItem>();

  if (accountError || !account) {
    console.error("Error fetching account:", accountError);
    return { error: "Account not found" };
  }

  // Fetch transactions for this account
  const { data: transactions, error: txError } = await supabase
    .from("transactions")
    .select(`
      id,
      amount,
      date,
      name,
      merchant_name,
      category_id,
      pending
    `)
    .eq("account_id", accountId)
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(100);

  if (txError) {
    console.error("Error fetching transactions:", txError);
  }

  // Get transaction count
  const { count: transactionCount } = await supabase
    .from("transactions")
    .select("*", { count: "exact", head: true })
    .eq("account_id", accountId)
    .eq("user_id", user.id);

  return {
    account: {
      ...account,
      transactions: transactions || [],
    } as AccountDetail,
    transactionCount: transactionCount || 0,
  };
}
