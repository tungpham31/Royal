"use server";

import { createClient } from "@/lib/supabase/server";

interface CashFlowParams {
  month: number;
  year: number;
}

interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

interface MonthlyCashFlow {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

export async function getCashFlowData({ month, year }: CashFlowParams) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Calculate date range for the selected month
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  const startDateStr = startDate.toISOString().split("T")[0];
  const endDateStr = endDate.toISOString().split("T")[0];

  // Fetch transactions for the month
  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("amount, plaid_category_primary, date")
    .eq("user_id", user.id)
    .gte("date", startDateStr)
    .lte("date", endDateStr);

  if (error) {
    console.error("Error fetching transactions:", error);
    return { error: "Failed to fetch transactions" };
  }

  // Calculate totals and breakdowns
  let totalIncome = 0;
  let totalExpenses = 0;
  const incomeByCategory: Record<string, number> = {};
  const expensesByCategory: Record<string, number> = {};

  (transactions || []).forEach((txn) => {
    // In Plaid, negative amounts are income (money coming in)
    // Positive amounts are expenses (money going out)
    const category = txn.plaid_category_primary || "Uncategorized";

    if (txn.amount < 0) {
      // Income
      const amount = Math.abs(txn.amount);
      totalIncome += amount;
      incomeByCategory[category] = (incomeByCategory[category] || 0) + amount;
    } else {
      // Expense
      totalExpenses += txn.amount;
      expensesByCategory[category] = (expensesByCategory[category] || 0) + txn.amount;
    }
  });

  // Convert to breakdown arrays with percentages
  const incomeBreakdown: CategoryBreakdown[] = Object.entries(incomeByCategory)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalIncome > 0 ? (amount / totalIncome) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const expensesBreakdown: CategoryBreakdown[] = Object.entries(expensesByCategory)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const totalSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0;

  return {
    summary: {
      income: totalIncome,
      expenses: totalExpenses,
      savings: totalSavings,
      savingsRate,
    },
    incomeBreakdown,
    expensesBreakdown,
  };
}

export async function getCashFlowTrend(months: number = 12) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Get data for the last N months
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months + 1);
  startDate.setDate(1);

  const startDateStr = startDate.toISOString().split("T")[0];
  const endDateStr = endDate.toISOString().split("T")[0];

  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("amount, date")
    .eq("user_id", user.id)
    .gte("date", startDateStr)
    .lte("date", endDateStr)
    .order("date", { ascending: true });

  if (error) {
    console.error("Error fetching transactions:", error);
    return { error: "Failed to fetch transactions" };
  }

  // Group by month
  const monthlyData: Record<string, { income: number; expenses: number }> = {};

  (transactions || []).forEach((txn) => {
    const date = new Date(txn.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { income: 0, expenses: 0 };
    }

    if (txn.amount < 0) {
      monthlyData[monthKey].income += Math.abs(txn.amount);
    } else {
      monthlyData[monthKey].expenses += txn.amount;
    }
  });

  // Convert to array sorted by date
  const trend: MonthlyCashFlow[] = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      income: data.income,
      expenses: data.expenses,
      net: data.income - data.expenses,
    }));

  return { trend };
}
