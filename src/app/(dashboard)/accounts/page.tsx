import { Header } from "@/components/layout/header";
import { getAccounts, getSectionOrder } from "@/actions/accounts";
import { getNetWorthHistory } from "@/actions/dashboard";
import { AccountsPageClient } from "./accounts-page-client";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Calculate change for each account type based on net worth history
function calculateTypeChanges(
  accounts: NonNullable<Awaited<ReturnType<typeof getAccounts>>["accounts"]>,
  history: NonNullable<Awaited<ReturnType<typeof getNetWorthHistory>>["history"]>
) {
  if (history.length < 2) return [];

  // Get current totals by type
  const currentByType: Record<string, number> = {};
  accounts.forEach((account) => {
    const type = account.type || "other";
    const balance = account.current_balance || 0;
    if (type === "credit" || type === "loan") {
      currentByType[type] = (currentByType[type] || 0) - Math.abs(balance);
    } else {
      currentByType[type] = (currentByType[type] || 0) + balance;
    }
  });

  // Get earliest history point (30 days ago or earliest available)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

  const earliestHistory = history.find((h) => h.date >= thirtyDaysAgoStr) || history[0];
  const latestHistory = history[history.length - 1];

  if (!earliestHistory || !latestHistory) return [];

  // Calculate asset change (depository + investment)
  const assetChange = latestHistory.total_assets - earliestHistory.total_assets;
  const liabilityChange = latestHistory.total_liabilities - earliestHistory.total_liabilities;

  // Approximate changes by type based on current distribution
  const currentAssets = Object.entries(currentByType)
    .filter(([type]) => type !== "credit" && type !== "loan")
    .reduce((sum, [, val]) => sum + val, 0);

  const currentLiabilities = Math.abs(
    Object.entries(currentByType)
      .filter(([type]) => type === "credit" || type === "loan")
      .reduce((sum, [, val]) => sum + val, 0)
  );

  const changes: { type: string; changeAmount: number; changePercent: number }[] = [];

  // Distribute asset change proportionally
  Object.entries(currentByType).forEach(([type, currentValue]) => {
    let changeAmount = 0;
    let previousValue = 0;

    if (type === "credit" || type === "loan") {
      // Liability types
      if (currentLiabilities > 0) {
        const proportion = Math.abs(currentValue) / currentLiabilities;
        changeAmount = -liabilityChange * proportion; // Negative because paying off debt is good
        previousValue = Math.abs(currentValue) + changeAmount;
      }
    } else {
      // Asset types
      if (currentAssets > 0) {
        const proportion = currentValue / currentAssets;
        changeAmount = assetChange * proportion;
        previousValue = currentValue - changeAmount;
      }
    }

    const changePercent = previousValue !== 0 ? (changeAmount / Math.abs(previousValue)) * 100 : 0;

    changes.push({
      type,
      changeAmount,
      changePercent,
    });
  });

  return changes;
}

export default async function AccountsPage() {
  const [accountsResult, historyResult, sectionOrderResult] = await Promise.all([
    getAccounts(),
    getNetWorthHistory(365), // Fetch 1 year of history
    getSectionOrder(),
  ]);

  const { accounts, error } = accountsResult;
  const { history } = historyResult;
  const { sectionOrder } = sectionOrderResult;

  // Get plaid items for sync buttons
  const supabase = await createClient();
  const { data: plaidItems } = await supabase
    .from("plaid_items")
    .select("id, institution_name")
    .returns<{ id: string; institution_name: string }[]>();

  // Calculate current net worth
  const netWorth = (accounts || []).reduce((total, account) => {
    const balance = account.current_balance || 0;
    if (account.type === "credit" || account.type === "loan") {
      return total - Math.abs(balance);
    }
    return total + balance;
  }, 0);

  // Calculate type changes for indicators
  const typeChanges = calculateTypeChanges(accounts || [], history || []);

  return (
    <>
      <Header
        title="Accounts"
        description="Manage your connected accounts"
      />

      <AccountsPageClient
        accounts={accounts || null}
        error={error || null}
        history={history || []}
        netWorth={netWorth}
        typeChanges={typeChanges}
        sectionOrder={sectionOrder}
        plaidItemIds={plaidItems?.map((item) => item.id) || []}
      />
    </>
  );
}
