"use server";

import { createClient } from "@/lib/supabase/server";
import { WidgetConfig, DEFAULT_WIDGET_LAYOUT } from "@/types/widgets";

interface AccountRow {
  type: string;
  current_balance: number | null;
}

interface TransactionRow {
  amount: number;
}

interface SpendingTransactionRow {
  amount: number;
  plaid_category_primary: string | null;
}

interface DashboardPreferencesRow {
  widget_layout: WidgetConfig[];
}

interface NetWorthHistoryRow {
  date: string;
  net_worth: number;
  total_assets: number;
  total_liabilities: number;
}

export async function getDashboardStats() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Get accounts
  const { data: accounts } = await supabase
    .from("accounts")
    .select("type, current_balance")
    .eq("user_id", user.id)
    .returns<AccountRow[]>();

  // Calculate totals
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

  const netWorth = totalAssets - totalLiabilities;

  // Get this month's transactions for income/expenses
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: transactions } = await supabase
    .from("transactions")
    .select("amount")
    .eq("user_id", user.id)
    .gte("date", startOfMonth.toISOString().split("T")[0])
    .returns<TransactionRow[]>();

  let monthlyIncome = 0;
  let monthlyExpenses = 0;

  (transactions || []).forEach((txn) => {
    // In Plaid, positive amounts are money leaving the account (expenses)
    // Negative amounts are money coming in (income)
    if (txn.amount > 0) {
      monthlyExpenses += txn.amount;
    } else {
      monthlyIncome += Math.abs(txn.amount);
    }
  });

  return {
    stats: {
      netWorth,
      totalAssets,
      totalLiabilities,
      monthlyIncome,
      monthlyExpenses,
    },
  };
}

export async function getRecentTransactions(limit = 5) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { data: transactions, error } = await supabase
    .from("transactions")
    .select(`
      *,
      account:accounts(name, mask)
    `)
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(limit);

  if (error) {
    return { error: "Failed to fetch transactions" };
  }

  return { transactions };
}

export async function getAccountsOverview() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { data: accounts, error } = await supabase
    .from("accounts")
    .select(`
      id,
      name,
      type,
      current_balance,
      plaid_item:plaid_items(institution_name)
    `)
    .eq("user_id", user.id)
    .order("current_balance", { ascending: false })
    .limit(6);

  if (error) {
    return { error: "Failed to fetch accounts" };
  }

  return { accounts };
}

export async function getDashboardPreferences() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { layout: DEFAULT_WIDGET_LAYOUT };
  }

  const { data: preferences } = await supabase
    .from("dashboard_preferences")
    .select("widget_layout")
    .eq("user_id", user.id)
    .single()
    .then((res) => ({ ...res, data: res.data as DashboardPreferencesRow | null }));

  if (!preferences || !preferences.widget_layout) {
    return { layout: DEFAULT_WIDGET_LAYOUT };
  }

  return { layout: preferences.widget_layout };
}

export async function saveDashboardPreferences(layout: WidgetConfig[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("dashboard_preferences")
    .upsert(
      {
        user_id: user.id,
        widget_layout: layout,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) {
    return { error: "Failed to save preferences" };
  }

  return { success: true };
}

export async function getNetWorthHistory(days = 30) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data: history, error } = await supabase
    .from("net_worth_history")
    .select("date, net_worth, total_assets, total_liabilities")
    .eq("user_id", user.id)
    .gte("date", startDate.toISOString().split("T")[0])
    .order("date", { ascending: true })
    .returns<NetWorthHistoryRow[]>();

  if (error) {
    return { error: "Failed to fetch net worth history" };
  }

  return { history: history || [] };
}

interface SpendingByDateRow {
  amount: number;
  date: string;
}

export async function getCurrentMonthSpending() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("amount, date")
    .eq("user_id", user.id)
    .gte("date", startOfMonth.toISOString().split("T")[0])
    .gt("amount", 0) // Only expenses (positive in Plaid = money out)
    .order("date", { ascending: true })
    .returns<SpendingByDateRow[]>();

  if (error) {
    return { error: "Failed to fetch spending data" };
  }

  // Group by date
  const dailyTotals: Record<string, number> = {};

  (transactions || []).forEach((txn) => {
    dailyTotals[txn.date] = (dailyTotals[txn.date] || 0) + txn.amount;
  });

  // Convert to array sorted by date
  const spendingHistory = Object.entries(dailyTotals)
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return { spendingHistory };
}
