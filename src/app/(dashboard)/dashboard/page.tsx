import { Header } from "@/components/layout/header";
import {
  getDashboardStats,
  getRecentTransactions,
  getDashboardPreferences,
  getNetWorthHistory,
  getCurrentMonthSpending,
} from "@/actions/dashboard";
import { DashboardClient } from "./dashboard-client";
import { SyncButton } from "@/components/plaid/sync-button";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const [
    statsResult,
    transactionsResult,
    preferencesResult,
    netWorthResult,
    spendingResult,
  ] = await Promise.all([
    getDashboardStats(),
    getRecentTransactions(),
    getDashboardPreferences(),
    getNetWorthHistory(365), // Fetch 1 year for time period filtering
    getCurrentMonthSpending(),
  ]);

  const currentNetWorth = statsResult.stats?.netWorth || 0;
  const transactions = transactionsResult.transactions || [];
  const layout = preferencesResult.layout;
  const netWorthHistory = netWorthResult.history || [];
  const spendingHistory = spendingResult.spendingHistory || [];
  const lastMonthHistory = spendingResult.lastMonthHistory || [];

  // Get plaid items for sync button
  const supabase = await createClient();
  const { data: plaidItems } = await supabase
    .from("plaid_items")
    .select("id")
    .returns<{ id: string }[]>();

  return (
    <>
      <Header title="Dashboard" description="Your financial overview" />

      <div className="p-6">
        <div className="flex justify-end mb-4">
          <SyncButton plaidItemIds={plaidItems?.map((item) => item.id) || []} />
        </div>
        <DashboardClient
          initialLayout={layout}
          currentNetWorth={currentNetWorth}
          netWorthHistory={netWorthHistory}
          spendingHistory={spendingHistory}
          lastMonthHistory={lastMonthHistory}
          transactions={transactions}
        />
      </div>
    </>
  );
}
