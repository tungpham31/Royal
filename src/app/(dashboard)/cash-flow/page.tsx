import { getCashFlowData, getCashFlowTrend } from "@/actions/cash-flow";
import { Header } from "@/components/layout/header";
import { CashFlowClient } from "./cash-flow-client";

interface CashFlowPageProps {
  searchParams: Promise<{ month?: string; year?: string; timeframe?: string }>;
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
    return <div className="p-6">Error loading cash flow data</div>;
  }

  return (
    <>
      <Header
        title="Cash Flow"
        description="Track your income and expenses over time"
      />
      <div className="p-6">
        <CashFlowClient
          summary={cashFlowResult.summary!}
          incomeBreakdown={cashFlowResult.incomeBreakdown!}
          expensesBreakdown={cashFlowResult.expensesBreakdown!}
          trend={trendResult.trend!}
          currentMonth={month}
          currentYear={year}
        />
      </div>
    </>
  );
}
