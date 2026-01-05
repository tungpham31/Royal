"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatPrivateAmount } from "@/lib/utils";
import { usePrivacyStore } from "@/lib/stores/privacy-store";

// Human-readable category names
const CATEGORY_NAMES: Record<string, string> = {
  INCOME: "Income",
  TRANSFER_IN: "Transfer In",
  TRANSFER_OUT: "Transfer Out",
  LOAN_PAYMENTS: "Loan Payment",
  RENT_AND_UTILITIES: "Rent & Utilities",
  FOOD_AND_DRINK: "Food & Drink",
  GENERAL_MERCHANDISE: "Shopping",
  TRANSPORTATION: "Transportation",
  TRAVEL: "Travel",
  ENTERTAINMENT: "Entertainment",
  PERSONAL_CARE: "Personal Care",
  GENERAL_SERVICES: "Services",
  HOME_IMPROVEMENT: "Home",
  MEDICAL: "Medical",
  GOVERNMENT_AND_NON_PROFIT: "Government",
  BANK_FEES: "Bank Fees",
};

// Category colors for bars
const EXPENSE_COLORS = [
  "bg-red-400",
  "bg-orange-400",
  "bg-amber-400",
  "bg-yellow-400",
  "bg-lime-400",
  "bg-emerald-400",
  "bg-teal-400",
  "bg-cyan-400",
  "bg-sky-400",
  "bg-blue-400",
];

const INCOME_COLORS = [
  "bg-green-500",
  "bg-green-400",
  "bg-emerald-500",
  "bg-emerald-400",
  "bg-teal-500",
];

interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

interface MonthlyCashFlow {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

interface CashFlowClientProps {
  summary: {
    income: number;
    expenses: number;
    savings: number;
    savingsRate: number;
  };
  incomeBreakdown: CategoryBreakdown[];
  expensesBreakdown: CategoryBreakdown[];
  trend: MonthlyCashFlow[];
  currentMonth: number;
  currentYear: number;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function CashFlowClient({
  summary,
  incomeBreakdown,
  expensesBreakdown,
  trend,
  currentMonth,
  currentYear,
}: CashFlowClientProps) {
  const router = useRouter();
  const { isPrivate } = usePrivacyStore();

  const handlePreviousMonth = () => {
    let newMonth = currentMonth - 1;
    let newYear = currentYear;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    router.push(`/cash-flow?month=${newMonth}&year=${newYear}`);
  };

  const handleNextMonth = () => {
    let newMonth = currentMonth + 1;
    let newYear = currentYear;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    router.push(`/cash-flow?month=${newMonth}&year=${newYear}`);
  };

  const formatCategory = (category: string) => {
    return CATEGORY_NAMES[category] || category;
  };

  // Find max for chart scaling
  const maxChartValue = Math.max(
    ...trend.map((t) => Math.max(t.income, t.expenses)),
    1
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Cash Flow</h1>
        <p className="text-muted-foreground">
          Track your income and expenses over time
        </p>
      </div>

      {/* Trend Chart */}
      <Card>
        <CardContent className="pt-6">
          <div className="h-48 flex items-end gap-1">
            {trend.map((month, index) => {
              const incomeHeight = (month.income / maxChartValue) * 100;
              const expenseHeight = (month.expenses / maxChartValue) * 100;
              const monthDate = new Date(month.month + "-01");
              const isCurrentMonth =
                monthDate.getMonth() + 1 === currentMonth &&
                monthDate.getFullYear() === currentYear;

              return (
                <div
                  key={month.month}
                  className={`flex-1 flex flex-col items-center gap-1 ${
                    isCurrentMonth ? "opacity-100" : "opacity-60"
                  }`}
                >
                  <div className="w-full flex gap-0.5 items-end h-36">
                    <div
                      className="flex-1 bg-green-400 rounded-t"
                      style={{ height: `${incomeHeight}%` }}
                    />
                    <div
                      className="flex-1 bg-red-400 rounded-t"
                      style={{ height: `${expenseHeight}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {monthDate.toLocaleDateString("en-US", { month: "short" })}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Month Navigator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold">
            {MONTH_NAMES[currentMonth - 1]} {currentYear}
          </h2>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-green-600">
              {formatPrivateAmount(summary.income, isPrivate)}
            </p>
            <p className="text-sm text-muted-foreground uppercase tracking-wide">
              Income
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-red-500">
              {formatPrivateAmount(summary.expenses, isPrivate)}
            </p>
            <p className="text-sm text-muted-foreground uppercase tracking-wide">
              Expenses
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className={`text-2xl font-bold ${summary.savings >= 0 ? "text-foreground" : "text-red-500"}`}>
              {summary.savings < 0 ? "-" : ""}
              {formatPrivateAmount(Math.abs(summary.savings), isPrivate)}
            </p>
            <p className="text-sm text-muted-foreground uppercase tracking-wide">
              Total Savings
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className={`text-2xl font-bold ${summary.savingsRate >= 0 ? "text-foreground" : "text-red-500"}`}>
              {isPrivate ? "***" : `${Math.round(summary.savingsRate)}%`}
            </p>
            <p className="text-sm text-muted-foreground uppercase tracking-wide">
              Savings Rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Income Breakdown */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Income</h3>
          {incomeBreakdown.length === 0 ? (
            <p className="text-muted-foreground text-sm">No income this month</p>
          ) : (
            <div className="space-y-3">
              {incomeBreakdown.map((item, index) => (
                <div key={item.category} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{formatCategory(item.category)}</span>
                    <span className="text-muted-foreground">
                      {formatPrivateAmount(item.amount, isPrivate)} ({item.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-6 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${INCOME_COLORS[index % INCOME_COLORS.length]} rounded-full transition-all`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expenses Breakdown */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Expenses</h3>
          {expensesBreakdown.length === 0 ? (
            <p className="text-muted-foreground text-sm">No expenses this month</p>
          ) : (
            <div className="space-y-3">
              {expensesBreakdown.map((item, index) => (
                <div key={item.category} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{formatCategory(item.category)}</span>
                    <span className="text-muted-foreground">
                      {formatPrivateAmount(item.amount, isPrivate)} ({item.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-6 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${EXPENSE_COLORS[index % EXPENSE_COLORS.length]} rounded-full transition-all`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
