"use server";

import { createClient } from "@/lib/supabase/server";

interface InvestmentAccountRow {
  id: string;
  user_id: string;
  name: string;
  type: string;
  subtype: string | null;
  mask: string | null;
  current_balance: number | null;
  plaid_item?: { institution_name: string } | null;
}

interface HoldingRow {
  id: string;
  user_id: string;
  account_id: string;
  ticker_symbol: string | null;
  security_name: string | null;
  quantity: number;
  cost_basis: number | null;
  value: number | null;
  account?: { name: string } | null;
}

export async function getInvestmentAccounts() {
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
    .eq("type", "investment")
    .returns<InvestmentAccountRow[]>();

  if (error) {
    return { error: "Failed to fetch investment accounts" };
  }

  const totalValue = (accounts || []).reduce((sum, acc) => sum + (acc.current_balance || 0), 0);

  return {
    accounts: accounts || [],
    totalValue,
  };
}

export async function getInvestmentHoldings() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { data: holdings, error } = await supabase
    .from("holdings")
    .select(`
      *,
      account:accounts(name)
    `)
    .eq("user_id", user.id)
    .order("value", { ascending: false })
    .returns<HoldingRow[]>();

  if (error) {
    return { error: "Failed to fetch holdings" };
  }

  return { holdings: holdings || [] };
}
