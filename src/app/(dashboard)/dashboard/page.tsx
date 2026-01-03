import { Header } from "@/components/layout/header";
import {
  getDashboardStats,
  getRecentTransactions,
  getDashboardPreferences,
  getNetWorthHistory,
  getCurrentMonthSpending,
} from "@/actions/dashboard";
import { DashboardClient } from "./dashboard-client";

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
    getNetWorthHistory(),
    getCurrentMonthSpending(),
  ]);

  const currentNetWorth = statsResult.stats?.netWorth || 0;
  const transactions = transactionsResult.transactions || [];
  const layout = preferencesResult.layout;
  const netWorthHistory = netWorthResult.history || [];
  const spendingHistory = spendingResult.spendingHistory || [];

  return (
    <>
      <Header title="Dashboard" description="Your financial overview" />

      <div className="p-6">
        <DashboardClient
          initialLayout={layout}
          currentNetWorth={currentNetWorth}
          netWorthHistory={netWorthHistory}
          spendingHistory={spendingHistory}
          transactions={transactions}
        />
      </div>
    </>
  );
}
