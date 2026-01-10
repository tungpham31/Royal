"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPrivateAmount, formatDate } from "@/lib/utils";
import { usePrivacyStore } from "@/lib/stores/privacy-store";
import {
  Utensils,
  Car,
  ShoppingBag,
  Film,
  Package,
  Sparkles,
  Wrench,
  Home,
  Stethoscope,
  Plane,
  Receipt,
  Banknote,
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
} from "lucide-react";

interface Transaction {
  id: string;
  name: string;
  merchant_name: string | null;
  amount: number;
  date: string;
  plaid_category_primary?: string | null;
  logo_url?: string | null;
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
  LOAN_PAYMENTS: "Loan",
  BANK_FEES: "Fees",
};

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  FOOD_AND_DRINK: Utensils,
  TRANSPORTATION: Car,
  SHOPPING: ShoppingBag,
  ENTERTAINMENT: Film,
  GENERAL_MERCHANDISE: Package,
  PERSONAL_CARE: Sparkles,
  GENERAL_SERVICES: Wrench,
  HOME_IMPROVEMENT: Home,
  MEDICAL: Stethoscope,
  TRAVEL: Plane,
  RENT_AND_UTILITIES: Receipt,
  INCOME: Banknote,
  TRANSFER_IN: ArrowDownLeft,
  TRANSFER_OUT: ArrowUpRight,
  LOAN_PAYMENTS: CreditCard,
  BANK_FEES: Receipt,
};

const CATEGORY_COLORS: Record<string, string> = {
  FOOD_AND_DRINK: "bg-orange-100 text-orange-600",
  TRANSPORTATION: "bg-blue-100 text-blue-600",
  SHOPPING: "bg-pink-100 text-pink-600",
  ENTERTAINMENT: "bg-purple-100 text-purple-600",
  GENERAL_MERCHANDISE: "bg-gray-100 text-gray-600",
  PERSONAL_CARE: "bg-rose-100 text-rose-600",
  GENERAL_SERVICES: "bg-slate-100 text-slate-600",
  HOME_IMPROVEMENT: "bg-amber-100 text-amber-600",
  MEDICAL: "bg-red-100 text-red-600",
  TRAVEL: "bg-cyan-100 text-cyan-600",
  RENT_AND_UTILITIES: "bg-yellow-100 text-yellow-600",
  INCOME: "bg-green-100 text-green-600",
  TRANSFER_IN: "bg-emerald-100 text-emerald-600",
  TRANSFER_OUT: "bg-violet-100 text-violet-600",
  LOAN_PAYMENTS: "bg-indigo-100 text-indigo-600",
  BANK_FEES: "bg-stone-100 text-stone-600",
};

function TransactionIcon({ category, merchantName }: { category?: string | null; merchantName: string }) {
  const Icon = category ? CATEGORY_ICONS[category] : null;
  const colorClass = category ? CATEGORY_COLORS[category] : "bg-gray-100 text-gray-600";

  if (Icon) {
    return (
      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${colorClass}`}>
        <Icon className="h-5 w-5" />
      </div>
    );
  }

  // Fallback to merchant initial
  const initial = merchantName.charAt(0).toUpperCase();
  return (
    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${colorClass}`}>
      <span className="text-sm font-semibold">{initial}</span>
    </div>
  );
}

export function TransactionsWidget({ transactions }: TransactionsWidgetProps) {
  const { isPrivate } = usePrivacyStore();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Recent Transactions</CardTitle>
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
              <div key={txn.id} className="flex items-center gap-3">
                <TransactionIcon
                  category={txn.plaid_category_primary}
                  merchantName={txn.merchant_name || txn.name}
                />
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
                <span className="font-semibold tabular-nums whitespace-nowrap">
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
