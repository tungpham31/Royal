import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PrivateAmount } from "@/components/ui/private-amount";
import { getNetWorthSummary, getNetWorthHistory } from "@/actions/net-worth";
import { NetWorthChart } from "./net-worth-chart";
import { Landmark, CreditCard, TrendingUp, TrendingDown } from "lucide-react";

const typeLabels: Record<string, string> = {
  checking: "Checking",
  savings: "Savings",
  "money market": "Money Market",
  cd: "CD",
  "401k": "401(k)",
  ira: "IRA",
  brokerage: "Brokerage",
  credit_card: "Credit Card",
  mortgage: "Mortgage",
  student: "Student Loan",
  auto: "Auto Loan",
  personal: "Personal Loan",
};

export default async function NetWorthPage() {
  const [summaryResult, historyResult] = await Promise.all([
    getNetWorthSummary(),
    getNetWorthHistory(),
  ]);

  const summary = summaryResult.summary || {
    totalAssets: 0,
    totalLiabilities: 0,
    netWorth: 0,
    assetsByType: {},
    liabilitiesByType: {},
  };

  const history = historyResult.history || [];

  return (
    <>
      <Header
        title="Net Worth"
        description="Track your assets and liabilities"
      />

      <div className="p-6 space-y-6">
        {/* Net Worth Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Assets
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums text-success">
                <PrivateAmount amount={summary.totalAssets} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Liabilities
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums text-destructive">
                <PrivateAmount amount={summary.totalLiabilities} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Net Worth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">
                <PrivateAmount amount={summary.netWorth} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Net Worth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Net Worth Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <p>Connect accounts to see your net worth history</p>
              </div>
            ) : (
              <NetWorthChart data={history} />
            )}
          </CardContent>
        </Card>

        {/* Assets & Liabilities Breakdown */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Assets */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Landmark className="h-5 w-5 text-success" />
                Assets
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(summary.assetsByType).length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No assets tracked
                </p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(summary.assetsByType).map(([type, data]) => (
                    <div key={type}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium capitalize">
                          {typeLabels[type] || type}
                        </span>
                        <span className="font-semibold tabular-nums text-success">
                          <PrivateAmount amount={data.total} />
                        </span>
                      </div>
                      <div className="pl-4 space-y-1">
                        {data.accounts.map((account, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-sm text-muted-foreground"
                          >
                            <span>{account.name}</span>
                            <span className="tabular-nums">
                              <PrivateAmount amount={account.balance} />
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Liabilities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-destructive" />
                Liabilities
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(summary.liabilitiesByType).length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No liabilities tracked
                </p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(summary.liabilitiesByType).map(
                    ([type, data]) => (
                      <div key={type}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium capitalize">
                            {typeLabels[type] || type}
                          </span>
                          <span className="font-semibold tabular-nums text-destructive">
                            <PrivateAmount amount={data.total} />
                          </span>
                        </div>
                        <div className="pl-4 space-y-1">
                          {data.accounts.map((account, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-sm text-muted-foreground"
                            >
                              <span>{account.name}</span>
                              <span className="tabular-nums">
                                <PrivateAmount amount={account.balance} />
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
