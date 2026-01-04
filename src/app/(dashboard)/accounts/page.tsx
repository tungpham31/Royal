import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAccounts } from "@/actions/accounts";
import { getNetWorthHistory } from "@/actions/dashboard";
import { AccountsList } from "./accounts-list";
import { AccountsNetWorthHeader } from "./accounts-net-worth-header";
import { AccountsSummary } from "./accounts-summary";
import { PlaidLinkButton } from "@/components/plaid/plaid-link";
import { SyncButton } from "@/components/plaid/sync-button";
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
  const [accountsResult, historyResult] = await Promise.all([
    getAccounts(),
    getNetWorthHistory(365), // Fetch 1 year of history
  ]);

  const { accounts, error } = accountsResult;
  const { history } = historyResult;

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

      <div className="p-6 space-y-6 overflow-hidden">
        <div className="flex items-center justify-end gap-2">
          <PlaidLinkButton />
          <SyncButton plaidItemIds={plaidItems?.map((item) => item.id) || []} />
        </div>

        {error ? (
          <Card>
            <CardContent className="py-12">
              <p className="text-center text-destructive">{error}</p>
            </CardContent>
          </Card>
        ) : !accounts || accounts.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Connected Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg">No accounts linked yet</p>
                <p className="text-sm mt-2">
                  Connect your bank accounts to start tracking your finances
                </p>
                <div className="mt-4">
                  <PlaidLinkButton />
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Net Worth Header with Chart */}
            <AccountsNetWorthHeader
              history={history || []}
              currentNetWorth={netWorth}
            />

            {/* Accounts and Summary side by side */}
            <div className="flex flex-col lg:flex-row gap-6 min-w-0">
              {/* Accounts grouped by type */}
              <div className="flex-1 min-w-0 overflow-hidden">
                <AccountsList accounts={accounts} typeChanges={typeChanges} />
              </div>

              {/* Summary sidebar */}
              <div className="lg:w-[280px] shrink-0">
                <AccountsSummary accounts={accounts} />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
