"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { RealEstateSubtype } from "@/types/database";

interface CreateRealEstateAssetData {
  name: string;
  subtype: RealEstateSubtype;
  value: number;
}

export async function createRealEstateAsset(data: CreateRealEstateAssetData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Create the account with is_manual=true and type='real_estate'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: account, error: accountError } = await (supabase as any)
    .from("accounts")
    .insert({
      user_id: user.id,
      name: data.name,
      type: "real_estate",
      subtype: data.subtype,
      current_balance: data.value,
      currency: "USD",
      is_manual: true,
      is_asset: true,
      include_in_net_worth: true,
      is_hidden: false,
      last_balance_update: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (accountError || !account) {
    console.error("Error creating real estate asset:", accountError);
    return { error: "Failed to create real estate asset" };
  }

  // Create initial valuation entry
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: valuationError } = await (supabase as any)
    .from("asset_valuations")
    .insert({
      user_id: user.id,
      account_id: account.id,
      valuation_date: new Date().toISOString().split("T")[0],
      value: data.value,
      notes: "Initial value",
    });

  if (valuationError) {
    console.error("Error creating initial valuation:", valuationError);
    // Don't fail - the account is created, just log the error
  }

  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  return { success: true, accountId: account.id };
}

export async function updateAssetValue(
  accountId: string,
  value: number,
  notes?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Verify the account exists and belongs to user
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: account, error: fetchError } = await (supabase as any)
    .from("accounts")
    .select("id, is_manual")
    .eq("id", accountId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !account) {
    return { error: "Account not found" };
  }

  if (!account.is_manual) {
    return { error: "Can only update value for manual accounts" };
  }

  // Update account balance
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (supabase as any)
    .from("accounts")
    .update({
      current_balance: value,
      last_balance_update: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", accountId)
    .eq("user_id", user.id);

  if (updateError) {
    console.error("Error updating account balance:", updateError);
    return { error: "Failed to update value" };
  }

  // Insert valuation history entry (upsert to handle same-day updates)
  const today = new Date().toISOString().split("T")[0];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: valuationError } = await (supabase as any)
    .from("asset_valuations")
    .upsert(
      {
        user_id: user.id,
        account_id: accountId,
        valuation_date: today,
        value: value,
        notes: notes || null,
      },
      { onConflict: "account_id,valuation_date" }
    );

  if (valuationError) {
    console.error("Error creating valuation entry:", valuationError);
    // Don't fail - value is updated, just log the error
  }

  revalidatePath("/accounts");
  revalidatePath(`/accounts/${accountId}`);
  revalidatePath("/dashboard");
  return { success: true };
}

interface ValuationHistoryRow {
  id: string;
  valuation_date: string;
  value: number;
  notes: string | null;
  created_at: string;
}

export async function getAssetValuationHistory(accountId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { data: valuations, error } = await supabase
    .from("asset_valuations")
    .select("id, valuation_date, value, notes, created_at")
    .eq("account_id", accountId)
    .eq("user_id", user.id)
    .order("valuation_date", { ascending: false })
    .returns<ValuationHistoryRow[]>();

  if (error) {
    console.error("Error fetching valuation history:", error);
    return { error: "Failed to fetch valuation history" };
  }

  return { valuations: valuations || [] };
}

export async function deleteManualAsset(accountId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Verify the account exists, belongs to user, and is manual
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: account, error: fetchError } = await (supabase as any)
    .from("accounts")
    .select("id, is_manual")
    .eq("id", accountId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !account) {
    return { error: "Account not found" };
  }

  if (!account.is_manual) {
    return { error: "Can only delete manual accounts" };
  }

  // Delete valuations first (due to foreign key)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from("asset_valuations")
    .delete()
    .eq("account_id", accountId)
    .eq("user_id", user.id);

  // Delete the account
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: deleteError } = await (supabase as any)
    .from("accounts")
    .delete()
    .eq("id", accountId)
    .eq("user_id", user.id);

  if (deleteError) {
    console.error("Error deleting manual asset:", deleteError);
    return { error: "Failed to delete asset" };
  }

  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  return { success: true };
}
