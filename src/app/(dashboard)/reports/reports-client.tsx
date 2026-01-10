"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PrivateAmount } from "@/components/ui/private-amount";
import { IncomeExpenseChart } from "./income-expense-chart";
import { DonutChart } from "./donut-chart";
import {
  BarChart3,
  PieChart,
  Store,
  TrendingUp,
  TrendingDown,
  Wallet,
  Percent,
  ChevronDown,
  Calendar,
  Loader2,
} from "lucide-react";

interface CategoryData {
  name: string;
  total: number;
  color: string;
}

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
}

interface MerchantData {
  name: string;
  total: number;
  count: number;
}

interface ReportsClientProps {
  spendingCategories: CategoryData[];
  incomeCategories: CategoryData[];
  monthlyData: MonthlyData[];
  merchants: MerchantData[];
  totalIncome: number;
  totalExpenses: number;
  currentTab: "spending" | "income";
  currentPeriod: string;
}

const PERIODS = [
  { value: "1", label: "This month" },
  { value: "3", label: "Last 3 months" },
  { value: "6", label: "Last 6 months" },
  { value: "12", label: "Last 12 months" },
];

export function ReportsClient({
  spendingCategories,
  incomeCategories,
  monthlyData,
  merchants,
  totalIncome,
  totalExpenses,
  currentTab,
  currentPeriod,
}: ReportsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  const netIncome = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netIncome / totalIncome) * 100 : 0;

  const navigateWithLoading = (url: string) => {
    setIsLoading(true);
    router.push(url);
  };

  const handleTabChange = (tab: "spending" | "income") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    navigateWithLoading(`/reports?${params.toString()}`);
  };

  const handlePeriodChange = (period: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", period);
    navigateWithLoading(`/reports?${params.toString()}`);
  };

  const currentPeriodLabel = PERIODS.find((p) => p.value === currentPeriod)?.label || "This month";

  return (
    <div className="space-y-6">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-background/60 z-50 flex items-center justify-center">
          <div className="flex items-center gap-3 bg-card px-6 py-4 rounded-lg shadow-lg border">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-sm font-medium">Loading...</span>
          </div>
        </div>
      )}

      {/* Tab Navigation and Date Range */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <Button
            variant={currentTab === "spending" ? "default" : "ghost"}
            size="sm"
            onClick={() => handleTabChange("spending")}
            className="px-4"
            disabled={isLoading}
          >
            Spending
          </Button>
          <Button
            variant={currentTab === "income" ? "default" : "ghost"}
            size="sm"
            onClick={() => handleTabChange("income")}
            className="px-4"
            disabled={isLoading}
          >
            Income
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Calendar className="h-4 w-4" />
              )}
              {currentPeriodLabel}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {PERIODS.map((period) => (
              <DropdownMenuItem
                key={period.value}
                onClick={() => handlePeriodChange(period.value)}
                className={currentPeriod === period.value ? "bg-muted" : ""}
              >
                {period.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">Total Income</span>
            </div>
            <div className="text-2xl font-bold tabular-nums text-green-600">
              <PrivateAmount amount={totalIncome} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <TrendingDown className="h-4 w-4" />
              <span className="text-sm font-medium">Total Expenses</span>
            </div>
            <div className="text-2xl font-bold tabular-nums text-red-500">
              <PrivateAmount amount={totalExpenses} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Wallet className="h-4 w-4" />
              <span className="text-sm font-medium">Net Income</span>
            </div>
            <div className={`text-2xl font-bold tabular-nums ${netIncome >= 0 ? "text-foreground" : "text-red-500"}`}>
              <PrivateAmount amount={netIncome} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Percent className="h-4 w-4" />
              <span className="text-sm font-medium">Savings Rate</span>
            </div>
            <div className={`text-2xl font-bold tabular-nums ${savingsRate >= 0 ? "text-foreground" : "text-red-500"}`}>
              {savingsRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Income vs Expenses Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Income vs Expenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <p>No transaction data available</p>
            </div>
          ) : (
            <IncomeExpenseChart data={monthlyData} />
          )}
        </CardContent>
      </Card>

      {/* Conditional content based on tab */}
      {currentTab === "spending" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Spending by Category */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Spending by Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              {spendingCategories.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <p>No spending data for this period</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <DonutChart
                    data={spendingCategories}
                    total={totalExpenses}
                    label="Total Spending"
                  />
                  <div className="space-y-2">
                    {spendingCategories.slice(0, 8).map((category) => (
                      <div
                        key={category.name}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="text-sm">{category.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-medium tabular-nums">
                            <PrivateAmount amount={category.total} />
                          </span>
                          <span className="text-sm text-muted-foreground ml-2">
                            ({((category.total / totalExpenses) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Merchants */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Top Merchants
              </CardTitle>
            </CardHeader>
            <CardContent>
              {merchants.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <p>No spending data for this period</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {merchants.map((merchant, index) => (
                    <div
                      key={merchant.name}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground w-6">
                          #{index + 1}
                        </span>
                        <div>
                          <p className="font-medium truncate max-w-48">
                            {merchant.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {merchant.count} transaction{merchant.count !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <span className="font-semibold tabular-nums">
                        <PrivateAmount amount={merchant.total} />
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Income Tab */
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Income by Category */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Income by Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              {incomeCategories.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <p>No income data for this period</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <DonutChart
                    data={incomeCategories}
                    total={totalIncome}
                    label="Total Income"
                    variant="income"
                  />
                  <div className="space-y-2">
                    {incomeCategories.slice(0, 8).map((category) => (
                      <div
                        key={category.name}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="text-sm">{category.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-medium tabular-nums">
                            <PrivateAmount amount={category.total} />
                          </span>
                          <span className="text-sm text-muted-foreground ml-2">
                            ({((category.total / totalIncome) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Income Sources Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Income Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {incomeCategories.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <p>No income data for this period</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center py-6">
                    <p className="text-4xl font-bold text-green-600 tabular-nums">
                      <PrivateAmount amount={totalIncome} />
                    </p>
                    <p className="text-muted-foreground mt-1">Total Income</p>
                  </div>
                  <div className="border-t pt-4 space-y-3">
                    {incomeCategories.map((category, index) => (
                      <div key={category.name} className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">{category.name}</span>
                            <span className="text-sm text-muted-foreground">
                              {((category.total / totalIncome) * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${(category.total / totalIncome) * 100}%`,
                                backgroundColor: category.color,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
