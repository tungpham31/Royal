"use server";

import { createClient } from "@/lib/supabase/server";

interface CategoryTransactionRow {
  amount: number;
  category?: { id: string; name: string; color: string } | null;
}

interface TransactionDateRow {
  amount: number;
  date: string;
}

interface MerchantTransactionRow {
  amount: number;
  merchant_name: string | null;
  name: string;
}

export async function getSpendingByCategory(months: number = 1) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  startDate.setDate(1);

  const { data: transactions, error } = await supabase
    .from("transactions")
    .select(`
      amount,
      category:categories(id, name, color)
    `)
    .eq("user_id", user.id)
    .gte("date", startDate.toISOString().split("T")[0])
    .gt("amount", 0) // Expenses only (positive amounts in Plaid)
    .returns<CategoryTransactionRow[]>();

  if (error) {
    return { error: "Failed to fetch transactions" };
  }

  const categoryTotals: Record<string, { name: string; total: number; color: string }> = {};

  (transactions || []).forEach((txn) => {
    const categoryName = txn.category?.name || "Uncategorized";
    const categoryColor = txn.category?.color || "#6B7280";

    if (!categoryTotals[categoryName]) {
      categoryTotals[categoryName] = { name: categoryName, total: 0, color: categoryColor };
    }
    categoryTotals[categoryName].total += txn.amount;
  });

  const sorted = Object.values(categoryTotals).sort((a, b) => b.total - a.total);

  return { categories: sorted };
}

export async function getMonthlyIncomeExpense(months: number = 6) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  startDate.setDate(1);

  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("amount, date")
    .eq("user_id", user.id)
    .gte("date", startDate.toISOString().split("T")[0])
    .returns<TransactionDateRow[]>();

  if (error) {
    return { error: "Failed to fetch transactions" };
  }

  const monthlyData: Record<string, { income: number; expenses: number }> = {};

  (transactions || []).forEach((txn) => {
    const month = txn.date.substring(0, 7); // YYYY-MM

    if (!monthlyData[month]) {
      monthlyData[month] = { income: 0, expenses: 0 };
    }

    if (txn.amount > 0) {
      monthlyData[month].expenses += txn.amount;
    } else {
      monthlyData[month].income += Math.abs(txn.amount);
    }
  });

  const sortedMonths = Object.keys(monthlyData).sort();
  const result = sortedMonths.map((month) => ({
    month: new Date(month + "-01").toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    }),
    ...monthlyData[month],
  }));

  return { monthlyData: result };
}

export async function getTopMerchants(limit: number = 10) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 1);

  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("amount, merchant_name, name")
    .eq("user_id", user.id)
    .gte("date", startDate.toISOString().split("T")[0])
    .gt("amount", 0)
    .returns<MerchantTransactionRow[]>();

  if (error) {
    return { error: "Failed to fetch transactions" };
  }

  const merchantTotals: Record<string, { name: string; total: number; count: number }> = {};

  (transactions || []).forEach((txn) => {
    const merchantName = txn.merchant_name || txn.name;

    if (!merchantTotals[merchantName]) {
      merchantTotals[merchantName] = { name: merchantName, total: 0, count: 0 };
    }
    merchantTotals[merchantName].total += txn.amount;
    merchantTotals[merchantName].count += 1;
  });

  const sorted = Object.values(merchantTotals)
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);

  return { merchants: sorted };
}
