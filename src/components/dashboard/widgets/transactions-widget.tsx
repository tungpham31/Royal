"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPrivateAmount, formatDate } from "@/lib/utils";
import { usePrivacyStore } from "@/lib/stores/privacy-store";
import { ArrowRightLeft } from "lucide-react";

interface Transaction {
  id: string;
  name: string;
  merchant_name: string | null;
  amount: number;
  date: string;
  plaid_category_primary?: string | null;
}

interface TransactionsWidgetProps {
  transactions: Transaction[];
}

const CATEGORY_LABELS: Record<string, string> = {
  FOOD_AND_DRINK: "Food & Drink",
  TRANSPORTATION: "Transport",
  SHOPPING: "Shopping",
  ENTERTAINMENT: "Entertainment",
  GENERAL_MERCHANDISE: "General",
  PERSONAL_CARE: "Personal",
  GENERAL_SERVICES: "Services",
  HOME_IMPROVEMENT: "Home",
  MEDICAL: "Medical",
  TRAVEL: "Travel",
  RENT_AND_UTILITIES: "Bills",
  INCOME: "Income",
  TRANSFER_IN: "Transfer",
  TRANSFER_OUT: "Transfer",
};

export function TransactionsWidget({ transactions }: TransactionsWidgetProps) {
  const { isPrivate } = usePrivacyStore();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2">
          <ArrowRightLeft className="h-5 w-5" />
          Recent Transactions
        </CardTitle>
        {transactions.length > 0 && (
          <Button variant="ghost" size="sm" asChild>
            <Link href="/transactions">View all</Link>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No transactions yet</p>
            <p className="text-sm">Connect a bank account to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((txn) => (
              <div key={txn.id} className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">
                    {txn.merchant_name || txn.name}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{formatDate(txn.date)}</span>
                    {txn.plaid_category_primary && (
                      <>
                        <span>•</span>
                        <span>
                          {CATEGORY_LABELS[txn.plaid_category_primary] ||
                            txn.plaid_category_primary.replace(/_/g, " ")}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <span className="font-semibold tabular-nums">
                  {txn.amount > 0 ? "-" : "+"}
                  {formatPrivateAmount(Math.abs(txn.amount), isPrivate)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
