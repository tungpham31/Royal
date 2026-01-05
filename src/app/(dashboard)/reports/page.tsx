import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PrivateAmount } from "@/components/ui/private-amount";
import {
  getSpendingByCategory,
  getMonthlyIncomeExpense,
  getTopMerchants,
} from "@/actions/reports";
import { IncomeExpenseChart } from "./income-expense-chart";
import { SpendingPieChart } from "./spending-pie-chart";
import { BarChart3, PieChart, Store, TrendingUp, TrendingDown, Wallet, Percent } from "lucide-react";

export default async function ReportsPage() {
  const [categoryResult, monthlyResult, merchantsResult] = await Promise.all([
    getSpendingByCategory(1),
    getMonthlyIncomeExpense(6),
    getTopMerchants(10),
  ]);

  const categories = categoryResult.categories || [];
  const monthlyData = monthlyResult.monthlyData || [];
  const merchants = merchantsResult.merchants || [];

  const totalSpending = categories.reduce((sum, cat) => sum + cat.total, 0);

  // Get current month's data for summary cards
  const currentMonth = monthlyData[monthlyData.length - 1];
  const totalIncome = currentMonth?.income || 0;
  const totalExpenses = currentMonth?.expenses || 0;
  const netIncome = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? ((netIncome / totalIncome) * 100) : 0;

  return (
    <>
      <Header title="Reports" description="Analyze your spending patterns" />

      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">Total Income</span>
              </div>
              <div className="text-2xl font-bold tabular-nums">
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
              <div className="text-2xl font-bold tabular-nums">
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
              <div className="text-2xl font-bold tabular-nums">
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
              <div className="text-2xl font-bold tabular-nums">
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
              {categories.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <p>No spending data this month</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <SpendingPieChart data={categories} />
                  <div className="space-y-2">
                    {categories.slice(0, 8).map((category) => (
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
                            ({((category.total / totalSpending) * 100).toFixed(1)}%)
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
                Top Merchants This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              {merchants.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <p>No spending data this month</p>
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
      </div>
    </>
  );
}
