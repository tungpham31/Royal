"use server";

import { createClient } from "@/lib/supabase/server";

interface NetWorthAccountRow {
  type: string;
  subtype: string | null;
  current_balance: number | null;
  name: string;
}

interface NetWorthHistoryRow {
  id: string;
  user_id: string;
  date: string;
  total_assets: number;
  total_liabilities: number;
  net_worth: number;
  created_at: string;
}

export async function getNetWorthSummary() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { data: accounts, error } = await supabase
    .from("accounts")
    .select("type, subtype, current_balance, name")
    .eq("user_id", user.id)
    .returns<NetWorthAccountRow[]>();

  if (error) {
    return { error: "Failed to fetch accounts" };
  }

  let totalAssets = 0;
  let totalLiabilities = 0;
  const assetsByType: Record<string, { total: number; accounts: Array<{ name: string; balance: number }> }> = {};
  const liabilitiesByType: Record<string, { total: number; accounts: Array<{ name: string; balance: number }> }> = {};

  (accounts || []).forEach((account) => {
    const balance = account.current_balance || 0;
    const type = account.subtype || account.type;

    if (account.type === "credit" || account.type === "loan") {
      totalLiabilities += Math.abs(balance);
      if (!liabilitiesByType[type]) {
        liabilitiesByType[type] = { total: 0, accounts: [] };
      }
      liabilitiesByType[type].total += Math.abs(balance);
      liabilitiesByType[type].accounts.push({ name: account.name, balance: Math.abs(balance) });
    } else {
      totalAssets += balance;
      if (!assetsByType[type]) {
        assetsByType[type] = { total: 0, accounts: [] };
      }
      assetsByType[type].total += balance;
      assetsByType[type].accounts.push({ name: account.name, balance });
    }
  });

  return {
    summary: {
      totalAssets,
      totalLiabilities,
      netWorth: totalAssets - totalLiabilities,
      assetsByType,
      liabilitiesByType,
    },
  };
}

export async function getNetWorthHistory() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { data: history, error } = await supabase
    .from("net_worth_history")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: true })
    .returns<NetWorthHistoryRow[]>();

  if (error) {
    return { error: "Failed to fetch history" };
  }

  return { history: history || [] };
}

export async function recordNetWorthSnapshot() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { data: accounts } = await supabase
    .from("accounts")
    .select("type, current_balance")
    .eq("user_id", user.id)
    .returns<{ type: string; current_balance: number | null }[]>();

  let totalAssets = 0;
  let totalLiabilities = 0;

  (accounts || []).forEach((account) => {
    const balance = account.current_balance || 0;
    if (account.type === "credit" || account.type === "loan") {
      totalLiabilities += Math.abs(balance);
    } else {
      totalAssets += balance;
    }
  });

  const today = new Date().toISOString().split("T")[0];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("net_worth_history")
    .upsert(
      {
        user_id: user.id,
        date: today,
        total_assets: totalAssets,
        total_liabilities: totalLiabilities,
        net_worth: totalAssets - totalLiabilities,
      },
      { onConflict: "user_id,date" }
    );

  if (error) {
    return { error: "Failed to record snapshot" };
  }

  return { success: true };
}
