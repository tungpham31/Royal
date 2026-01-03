"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import {
  Wallet,
  CreditCard,
  Landmark,
  TrendingUp,
  PiggyBank,
} from "lucide-react";
import { PlaidLinkButton } from "@/components/plaid/plaid-link";

interface Account {
  id: string;
  name: string;
  type: string;
  current_balance: number | null;
  plaid_item?: {
    institution_name: string;
  } | null;
}

interface AccountsWidgetProps {
  accounts: Account[];
}

const accountTypeIcons: Record<string, React.ReactNode> = {
  depository: <Landmark className="h-4 w-4" />,
  credit: <CreditCard className="h-4 w-4" />,
  investment: <TrendingUp className="h-4 w-4" />,
  loan: <PiggyBank className="h-4 w-4" />,
  other: <Wallet className="h-4 w-4" />,
};

export function AccountsWidget({ accounts }: AccountsWidgetProps) {
  const hasAccounts = accounts.length > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Accounts
        </CardTitle>
        {hasAccounts ? (
          <Button variant="ghost" size="sm" asChild>
            <Link href="/accounts">View all</Link>
          </Button>
        ) : (
          <PlaidLinkButton />
        )}
      </CardHeader>
      <CardContent>
        {!hasAccounts ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No accounts linked</p>
            <p className="text-sm">Add your first account to track your finances</p>
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-muted-foreground">
                    {accountTypeIcons[account.type] || accountTypeIcons.other}
                  </div>
                  <div>
                    <p className="font-medium">{account.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {account.plaid_item?.institution_name}
                    </p>
                  </div>
                </div>
                <span
                  className={`font-semibold tabular-nums ${
                    account.type === "credit" || account.type === "loan"
                      ? "text-destructive"
                      : ""
                  }`}
                >
                  {formatCurrency(account.current_balance || 0)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
