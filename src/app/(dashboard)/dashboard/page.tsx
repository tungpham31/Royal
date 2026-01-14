import { Header } from "@/components/layout/header";
import {
  getDashboardStats,
  getRecentTransactions,
  getDashboardPreferences,
  getNetWorthHistory,
  getCurrentMonthSpending,
  getLastSyncTime,
  getPassiveCashFlowStats,
} from "@/actions/dashboard";
import { DashboardClient } from "./dashboard-client";
import { SyncButton } from "@/components/plaid/sync-button";

export default async function DashboardPage() {
  const [
    statsResult,
    transactionsResult,
    preferencesResult,
    netWorthResult,
    spendingResult,
    lastSyncResult,
    passiveCashFlowResult,
  ] = await Promise.all([
    getDashboardStats(),
    getRecentTransactions(),
    getDashboardPreferences(),
    getNetWorthHistory(365), // Fetch 1 year for time period filtering
    getCurrentMonthSpending(),
    getLastSyncTime(),
    getPassiveCashFlowStats(),
  ]);

  const currentNetWorth = statsResult.stats?.netWorth || 0;
  const transactions = transactionsResult.transactions || [];
  const layout = preferencesResult.layout;
  const netWorthHistory = netWorthResult.history || [];
  const spendingHistory = spendingResult.spendingHistory || [];
  const lastMonthHistory = spendingResult.lastMonthHistory || [];
  const passiveCashFlowStats = passiveCashFlowResult.stats || { totalCashFlowAssets: 0, passiveCashFlow3Pct: 0, passiveCashFlow4Pct: 0 };

  return (
    <>
      <Header title="Dashboard" description="Your financial overview" />

      <div className="p-6">
        <div className="flex justify-end mb-4">
          <SyncButton lastSyncTime={lastSyncResult.lastSyncTime} />
        </div>
        <DashboardClient
          initialLayout={layout}
          currentNetWorth={currentNetWorth}
          netWorthHistory={netWorthHistory}
          spendingHistory={spendingHistory}
          lastMonthHistory={lastMonthHistory}
          transactions={transactions}
          passiveCashFlowStats={passiveCashFlowStats}
        />
      </div>
    </>
  );
}
