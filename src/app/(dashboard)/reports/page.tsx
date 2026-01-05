import { Header } from "@/components/layout/header";
import {
  getSpendingByCategory,
  getIncomeByCategory,
  getMonthlyIncomeExpense,
  getTopMerchants,
} from "@/actions/reports";
import { ReportsClient } from "./reports-client";

interface ReportsPageProps {
  searchParams: Promise<{ tab?: string; period?: string }>;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const params = await searchParams;
  const currentTab = (params.tab as "spending" | "income") || "spending";
  const currentPeriod = params.period || "1";
  const months = parseInt(currentPeriod);

  const [spendingResult, incomeResult, monthlyResult, merchantsResult] = await Promise.all([
    getSpendingByCategory(months),
    getIncomeByCategory(months),
    getMonthlyIncomeExpense(Math.max(months, 6)),
    getTopMerchants(10),
  ]);

  const spendingCategories = spendingResult.categories || [];
  const incomeCategories = incomeResult.categories || [];
  const monthlyData = monthlyResult.monthlyData || [];
  const merchants = merchantsResult.merchants || [];

  // Calculate totals for the selected period
  const totalExpenses = spendingCategories.reduce((sum, cat) => sum + cat.total, 0);
  const totalIncome = incomeCategories.reduce((sum, cat) => sum + cat.total, 0);

  return (
    <>
      <Header title="Reports" description="Analyze your spending and income patterns" />

      <div className="p-6">
        <ReportsClient
          spendingCategories={spendingCategories}
          incomeCategories={incomeCategories}
          monthlyData={monthlyData}
          merchants={merchants}
          totalIncome={totalIncome}
          totalExpenses={totalExpenses}
          currentTab={currentTab}
          currentPeriod={currentPeriod}
        />
      </div>
    </>
  );
}
