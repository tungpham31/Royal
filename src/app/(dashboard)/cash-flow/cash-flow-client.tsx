"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatPrivateAmount } from "@/lib/utils";
import { usePrivacyStore } from "@/lib/stores/privacy-store";

// Human-readable category names
const CATEGORY_NAMES: Record<string, string> = {
  INCOME: "Interest",
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
  HOME_IMPROVEMENT: "Home Improvement",
  MEDICAL: "Medical",
  GOVERNMENT_AND_NON_PROFIT: "Government",
  BANK_FEES: "Bank Fees",
};

// Category emojis
const CATEGORY_EMOJIS: Record<string, string> = {
  INCOME: "🌱",
  TRANSFER_IN: "↔️",
  TRANSFER_OUT: "↔️",
  LOAN_PAYMENTS: "💳",
  RENT_AND_UTILITIES: "🏠",
  FOOD_AND_DRINK: "🍽️",
  GENERAL_MERCHANDISE: "🛍️",
  TRANSPORTATION: "🚗",
  TRAVEL: "✈️",
  ENTERTAINMENT: "🎬",
  PERSONAL_CARE: "✨",
  GENERAL_SERVICES: "🔧",
  HOME_IMPROVEMENT: "🔨",
  MEDICAL: "🏥",
  GOVERNMENT_AND_NON_PROFIT: "🏛️",
  BANK_FEES: "📋",
  // Additional friendly names
  Interest: "🌱",
  "Transfer In": "↔️",
  "Transfer Out": "↔️",
  "Loan Payment": "💳",
  "Rent & Utilities": "🏠",
  "Food & Drink": "🍽️",
  Shopping: "🛍️",
  Transportation: "🚗",
  Travel: "✈️",
  Entertainment: "🎬",
  "Personal Care": "✨",
  Services: "🔧",
  "Home Improvement": "🔨",
  Medical: "🏥",
  Government: "🏛️",
  "Bank Fees": "📋",
};

// Expense bar colors - Monarch-style soft pastels
const EXPENSE_BAR_COLORS = [
  "bg-[#F5A5A5]", // coral/salmon for largest expense
  "bg-[#F5C9A5]", // peach/orange
  "bg-[#F5D5A5]", // light orange
  "bg-[#C8E6C9]", // soft mint green
  "bg-[#D4E6D5]", // lighter mint
  "bg-[#E0E6E0]", // very light gray-green
  "bg-[#E5E5E5]", // light gray
  "bg-[#ECECEC]", // lighter gray
  "bg-[#F2F2F2]", // very light gray
  "bg-[#F8F8F8]", // near white
];

// Income bar color - Monarch-style mint green
const INCOME_BAR_COLOR = "bg-[#9DD9A8]";

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

type TimeFrame = "monthly" | "quarterly" | "yearly";

export function CashFlowClient({
  summary,
  incomeBreakdown,
  expensesBreakdown,
  trend,
  currentMonth,
  currentYear,
}: CashFlowClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isPrivate } = usePrivacyStore();

  const timeFrame = (searchParams.get("timeframe") as TimeFrame) || "monthly";

  const handlePreviousMonth = () => {
    let newMonth = currentMonth - 1;
    let newYear = currentYear;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    router.push(`/cash-flow?month=${newMonth}&year=${newYear}&timeframe=${timeFrame}`);
  };

  const handleNextMonth = () => {
    let newMonth = currentMonth + 1;
    let newYear = currentYear;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    router.push(`/cash-flow?month=${newMonth}&year=${newYear}&timeframe=${timeFrame}`);
  };

  const handleTimeFrameChange = (newTimeFrame: TimeFrame) => {
    router.push(`/cash-flow?month=${currentMonth}&year=${currentYear}&timeframe=${newTimeFrame}`);
  };

  const formatCategory = (category: string) => {
    return CATEGORY_NAMES[category] || category;
  };

  const getCategoryEmoji = (category: string) => {
    return CATEGORY_EMOJIS[category] || CATEGORY_EMOJIS[formatCategory(category)] || "📋";
  };

  // Find max for chart scaling
  const maxChartValue = Math.max(
    ...trend.map((t) => Math.max(t.income, t.expenses)),
    1
  );

  // Format Y-axis value
  const formatYAxis = (value: number) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value}`;
  };

  // Generate Y-axis labels
  const yAxisLabels = [maxChartValue, maxChartValue * 0.66, maxChartValue * 0.33, 0];

  return (
    <div className="space-y-6">
      {/* Time Period Toggle */}
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <Button
            variant={timeFrame === "monthly" ? "default" : "ghost"}
            size="sm"
            onClick={() => handleTimeFrameChange("monthly")}
            className="px-4"
          >
            Monthly
          </Button>
          <Button
            variant={timeFrame === "quarterly" ? "default" : "ghost"}
            size="sm"
            onClick={() => handleTimeFrameChange("quarterly")}
            className="px-4"
          >
            Quarterly
          </Button>
          <Button
            variant={timeFrame === "yearly" ? "default" : "ghost"}
            size="sm"
            onClick={() => handleTimeFrameChange("yearly")}
            className="px-4"
          >
            Yearly
          </Button>
        </div>
      </div>

      {/* Trend Chart with Y-axis */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex">
            {/* Y-axis labels */}
            <div className="flex flex-col justify-between h-44 pr-2 text-right">
              {yAxisLabels.map((value, i) => (
                <span key={i} className="text-xs text-muted-foreground">
                  {formatYAxis(Math.round(value))}
                </span>
              ))}
            </div>

            {/* Chart */}
            <div className="flex-1 flex items-end gap-1 h-44 border-l border-b border-muted pl-2">
              {trend.map((month) => {
                const incomeHeight = (month.income / maxChartValue) * 100;
                const expenseHeight = (month.expenses / maxChartValue) * 100;
                const monthDate = new Date(month.month + "-01");
                const isCurrentMonth =
                  monthDate.getMonth() + 1 === currentMonth &&
                  monthDate.getFullYear() === currentYear;

                return (
                  <div
                    key={month.month}
                    className={`flex-1 flex flex-col items-center gap-1 cursor-pointer transition-opacity ${
                      isCurrentMonth ? "opacity-100" : "opacity-50 hover:opacity-75"
                    }`}
                    onClick={() => {
                      const m = monthDate.getMonth() + 1;
                      const y = monthDate.getFullYear();
                      router.push(`/cash-flow?month=${m}&year=${y}&timeframe=${timeFrame}`);
                    }}
                  >
                    <div className="w-full flex gap-0.5 items-end h-36">
                      <div
                        className="flex-1 bg-[#9DD9A8] rounded-t transition-all hover:bg-[#8BCF98]"
                        style={{ height: `${incomeHeight}%` }}
                        title={`Income: ${formatPrivateAmount(month.income, isPrivate)}`}
                      />
                      <div
                        className="flex-1 bg-[#F5A5A5] rounded-t transition-all hover:bg-[#F09090]"
                        style={{ height: `${expenseHeight}%` }}
                        title={`Expenses: ${formatPrivateAmount(month.expenses, isPrivate)}`}
                      />
                    </div>
                    <span className={`text-xs ${isCurrentMonth ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                      {monthDate.toLocaleDateString("en-US", { month: "short" })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chart Legend */}
          <div className="flex items-center justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#9DD9A8] rounded" />
              <span className="text-muted-foreground">Income</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#F5A5A5] rounded" />
              <span className="text-muted-foreground">Expenses</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Month Navigator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold min-w-[180px] text-center">
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
            <div className="space-y-2">
              {incomeBreakdown.map((item) => (
                <div
                  key={item.category}
                  className="relative h-10 bg-muted rounded-lg overflow-hidden cursor-pointer hover:bg-muted/80 transition-colors"
                  onClick={() => {
                    // Navigate to transactions filtered by category
                    router.push(`/transactions?category=${encodeURIComponent(item.category)}`);
                  }}
                >
                  <div
                    className={`absolute inset-y-0 left-0 ${INCOME_BAR_COLOR} rounded-lg transition-all`}
                    style={{ width: `${item.percentage}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-between px-3">
                    <span className="flex items-center gap-2 font-medium text-sm z-10">
                      <span>{getCategoryEmoji(item.category)}</span>
                      {formatCategory(item.category)}
                    </span>
                    <span className="text-sm text-muted-foreground z-10">
                      {formatPrivateAmount(item.amount, isPrivate)} ({item.percentage.toFixed(1)}%)
                    </span>
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
            <div className="space-y-2">
              {expensesBreakdown.map((item, index) => (
                <div
                  key={item.category}
                  className="relative h-10 bg-muted rounded-lg overflow-hidden cursor-pointer hover:bg-muted/80 transition-colors"
                  onClick={() => {
                    // Navigate to transactions filtered by category
                    router.push(`/transactions?category=${encodeURIComponent(item.category)}`);
                  }}
                >
                  <div
                    className={`absolute inset-y-0 left-0 ${EXPENSE_BAR_COLORS[index % EXPENSE_BAR_COLORS.length]} rounded-lg transition-all`}
                    style={{ width: `${item.percentage}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-between px-3">
                    <span className="flex items-center gap-2 font-medium text-sm z-10">
                      <span>{getCategoryEmoji(item.category)}</span>
                      {formatCategory(item.category)}
                    </span>
                    <span className="text-sm text-muted-foreground z-10">
                      {formatPrivateAmount(item.amount, isPrivate)} ({item.percentage.toFixed(1)}%)
                    </span>
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
