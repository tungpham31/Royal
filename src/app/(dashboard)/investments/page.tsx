import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PrivateAmount } from "@/components/ui/private-amount";
import { getInvestmentAccounts, getInvestmentHoldings } from "@/actions/investments";
import { getAccountDisplayName } from "@/lib/account-utils";
import { TrendingUp, TrendingDown, PieChart, Building2 } from "lucide-react";
import { PlaidLinkButton } from "@/components/plaid/plaid-link";

export default async function InvestmentsPage() {
  const [accountsResult, holdingsResult] = await Promise.all([
    getInvestmentAccounts(),
    getInvestmentHoldings(),
  ]);

  const accounts = accountsResult.accounts || [];
  const holdings = holdingsResult.holdings || [];
  const totalValue = accountsResult.totalValue || 0;

  const hasInvestments = accounts.length > 0;

  return (
    <>
      <Header
        title="Investments"
        description="Track your investment portfolio"
      />

      <div className="p-6 space-y-6">
        {/* Portfolio Summary */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Portfolio Value
              </CardTitle>
              <PieChart className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">
                <PrivateAmount amount={totalValue} />
              </div>
              <p className="text-xs text-muted-foreground">
                Across {accounts.length} account{accounts.length !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Holdings
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">
                {holdings.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Different securities
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Accounts
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">
                {accounts.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Investment accounts
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Investment Accounts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Investment Accounts</CardTitle>
            <PlaidLinkButton />
          </CardHeader>
          <CardContent>
            {!hasInvestments ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg">No investment accounts connected</p>
                <p className="text-sm mt-2">
                  Link a brokerage account to track your investments
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {accounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="flex items-center gap-4">
                      <div className="rounded-lg bg-muted p-2">
                        <TrendingUp className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{getAccountDisplayName(account)}</p>
                        <p className="text-sm text-muted-foreground">
                          {account.plaid_item?.institution_name}
                          {account.mask && ` • ••${account.mask}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold tabular-nums">
                        <PrivateAmount amount={account.current_balance || 0} />
                      </p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {account.subtype || "Investment"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Holdings */}
        {holdings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Holdings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {holdings.map((holding) => (
                  <div
                    key={holding.id}
                    className="flex items-center justify-between py-3 border-b last:border-0"
                  >
                    <div>
                      <p className="font-medium">
                        {holding.security_name || holding.ticker_symbol}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {holding.ticker_symbol && (
                          <span className="font-mono">{holding.ticker_symbol}</span>
                        )}
                        <span>•</span>
                        <span>{holding.quantity} shares</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold tabular-nums">
                        <PrivateAmount amount={holding.value || 0} />
                      </p>
                      {holding.cost_basis && (
                        <p className="text-sm tabular-nums text-muted-foreground">
                          {(holding.value || 0) >= holding.cost_basis ? "+" : ""}
                          <PrivateAmount amount={(holding.value || 0) - holding.cost_basis} />
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
