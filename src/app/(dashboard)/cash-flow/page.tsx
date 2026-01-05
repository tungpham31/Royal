import { getCashFlowData, getCashFlowTrend } from "@/actions/cash-flow";
import { CashFlowClient } from "./cash-flow-client";

interface CashFlowPageProps {
  searchParams: Promise<{ month?: string; year?: string }>;
}

export default async function CashFlowPage({ searchParams }: CashFlowPageProps) {
  const params = await searchParams;
  const now = new Date();
  const month = params.month ? parseInt(params.month) : now.getMonth() + 1;
  const year = params.year ? parseInt(params.year) : now.getFullYear();

  const [cashFlowResult, trendResult] = await Promise.all([
    getCashFlowData({ month, year }),
    getCashFlowTrend(12),
  ]);

  if (cashFlowResult.error || trendResult.error) {
    return <div>Error loading cash flow data</div>;
  }

  return (
    <CashFlowClient
      summary={cashFlowResult.summary!}
      incomeBreakdown={cashFlowResult.incomeBreakdown!}
      expensesBreakdown={cashFlowResult.expensesBreakdown!}
      trend={trendResult.trend!}
      currentMonth={month}
      currentYear={year}
    />
  );
}
