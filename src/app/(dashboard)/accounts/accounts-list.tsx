"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  CreditCard,
  Landmark,
  PiggyBank,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { formatPrivateAmount } from "@/lib/utils";
import { usePrivacyStore } from "@/lib/stores/privacy-store";

interface Account {
  id: string;
  name: string;
  official_name: string | null;
  type: string;
  subtype: string | null;
  mask: string | null;
  current_balance: number | null;
  available_balance: number | null;
  currency: string;
  plaid_item?: {
    institution_name: string;
  } | null;
}

interface AccountsListProps {
  groupedAccounts: Record<string, Account[]>;
}

const accountTypeIcons: Record<string, React.ReactNode> = {
  depository: <Landmark className="h-5 w-5" />,
  credit: <CreditCard className="h-5 w-5" />,
  investment: <TrendingUp className="h-5 w-5" />,
  loan: <PiggyBank className="h-5 w-5" />,
  other: <Wallet className="h-5 w-5" />,
};

const accountTypeLabels: Record<string, string> = {
  depository: "Cash",
  credit: "Credit",
  investment: "Investment",
  loan: "Loan",
  other: "Other",
};

export function AccountsList({ groupedAccounts }: AccountsListProps) {
  const router = useRouter();
  const { isPrivate } = usePrivacyStore();

  const getTotalByInstitution = (accounts: Account[]) => {
    return accounts.reduce((total, account) => {
      const balance = account.current_balance || 0;
      // Credit and loan balances are typically negative (debts)
      if (account.type === "credit" || account.type === "loan") {
        return total - Math.abs(balance);
      }
      return total + balance;
    }, 0);
  };

  return (
    <div className="space-y-6">
      {Object.entries(groupedAccounts).map(([institution, accounts]) => (
        <Card key={institution}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-muted p-2">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                </div>
                <CardTitle className="text-lg">{institution}</CardTitle>
              </div>
              <span className="text-lg font-semibold tabular-nums">
                {formatPrivateAmount(getTotalByInstitution(accounts), isPrivate)}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-muted-foreground">
                      {accountTypeIcons[account.type] || accountTypeIcons.other}
                    </div>
                    <div>
                      <p className="font-medium">{account.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="secondary" className="text-xs">
                          {accountTypeLabels[account.type] || account.type}
                        </Badge>
                        {account.mask && <span>••••{account.mask}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold tabular-nums">
                      {formatPrivateAmount(account.current_balance || 0, isPrivate)}
                    </p>
                    {account.available_balance !== null &&
                      account.available_balance !== account.current_balance && (
                        <p className="text-sm text-muted-foreground tabular-nums">
                          {formatPrivateAmount(account.available_balance, isPrivate)} available
                        </p>
                      )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
