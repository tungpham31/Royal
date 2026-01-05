"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface GetTransactionsParams {
  page?: number;
  limit?: number;
  accountId?: string;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  sort?: string;
}

export async function getTransactions({
  page = 1,
  limit = 50,
  accountId,
  categoryId,
  startDate,
  endDate,
  search,
  sort = "date_desc",
}: GetTransactionsParams = {}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  let query = supabase
    .from("transactions")
    .select(`
      id,
      name,
      merchant_name,
      amount,
      date,
      pending,
      plaid_category_primary,
      plaid_category_detailed,
      account:accounts(name, mask, type),
      category:categories(name, icon, color)
    `, { count: "exact" })
    .eq("user_id", user.id);

  // Apply sorting
  switch (sort) {
    case "date_asc":
      query = query.order("date", { ascending: true }).order("created_at", { ascending: true });
      break;
    case "amount_desc":
      query = query.order("amount", { ascending: false }).order("date", { ascending: false });
      break;
    case "amount_asc":
      query = query.order("amount", { ascending: true }).order("date", { ascending: false });
      break;
    case "date_desc":
    default:
      query = query.order("date", { ascending: false }).order("created_at", { ascending: false });
      break;
  }

  if (accountId) {
    query = query.eq("account_id", accountId);
  }

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  if (startDate) {
    query = query.gte("date", startDate);
  }

  if (endDate) {
    query = query.lte("date", endDate);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,merchant_name.ilike.%${search}%`);
  }

  const offset = (page - 1) * limit;
  query = query.range(offset, offset + limit - 1);

  const { data: transactions, error, count } = await query;

  if (error) {
    console.error("Error fetching transactions:", error);
    return { error: "Failed to fetch transactions" };
  }

  return {
    transactions,
    totalCount: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  };
}

export async function updateTransactionCategory(
  transactionId: string,
  categoryId: string | null
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("transactions")
    .update({ category_id: categoryId })
    .eq("id", transactionId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error updating transaction:", error);
    return { error: "Failed to update transaction" };
  }

  revalidatePath("/transactions");
  return { success: true };
}

export async function getCategories() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { data: categories, error } = await supabase
    .from("categories")
    .select("*")
    .or(`user_id.is.null,user_id.eq.${user.id}`)
    .order("name");

  if (error) {
    console.error("Error fetching categories:", error);
    return { error: "Failed to fetch categories" };
  }

  return { categories };
}
