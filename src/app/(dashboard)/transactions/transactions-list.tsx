"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { formatPrivateAmount, formatDate } from "@/lib/utils";
import { usePrivacyStore } from "@/lib/stores/privacy-store";
import { updateTransactionCategory } from "@/actions/transactions";

interface Transaction {
  id: string;
  name: string;
  merchant_name: string | null;
  amount: number;
  date: string;
  pending: boolean;
  plaid_category_primary: string | null;
  plaid_category_detailed: string | null;
  account: {
    name: string;
    mask: string | null;
    type: string;
  } | null;
  category: {
    name: string;
    icon: string | null;
    color: string | null;
  } | null;
}

interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

interface TransactionsListProps {
  transactions: Transaction[];
  categories: Category[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

// Category emoji icons - supports both friendly names and Plaid's format
const CATEGORY_EMOJIS: Record<string, string> = {
  // Friendly names
  "Food & Dining": "🍽️",
  "Food & Drink": "🍽️",
  "Restaurants & Bars": "🍽️",
  Transportation: "🚗",
  "Auto Insurance": "🚗",
  "Gas & EV Charging": "⛽",
  Shopping: "🛍️",
  Clothing: "👕",
  Entertainment: "🎬",
  "General Merchandise": "📦",
  "Personal Care": "✨",
  "General Services": "🔧",
  "Home Improvement": "🏠",
  Medical: "🏥",
  Travel: "✈️",
  "Rent & Utilities": "🏠",
  Bills: "📄",
  Income: "💰",
  Interest: "🌱",
  Transfer: "↔️",
  "Credit Card Payment": "💳",
  "Loan Payments": "💳",
  Loan: "💳",
  Fees: "📋",
  Software: "💻",
  Groceries: "🛒",
  "Coffee Shops": "☕",
  Taxi: "🚕",
  // Plaid category format (uppercase)
  INCOME: "💰",
  TRANSFER_IN: "↔️",
  TRANSFER_OUT: "↔️",
  LOAN_PAYMENTS: "💳",
  RENT_AND_UTILITIES: "🏠",
  FOOD_AND_DRINK: "🍽️",
  GENERAL_MERCHANDISE: "📦",
  TRANSPORTATION: "🚗",
  TRAVEL: "✈️",
  ENTERTAINMENT: "🎬",
  PERSONAL_CARE: "✨",
  GENERAL_SERVICES: "🔧",
  HOME_IMPROVEMENT: "🏠",
  MEDICAL: "🏥",
  GOVERNMENT_AND_NON_PROFIT: "🏛️",
  BANK_FEES: "📋",
};

// Account type colors for the dot indicator
const ACCOUNT_COLORS: Record<string, string> = {
  depository: "bg-green-500",
  credit: "bg-orange-500",
  investment: "bg-blue-500",
  loan: "bg-red-500",
  other: "bg-gray-500",
};

export function TransactionsList({
  transactions,
  categories,
  currentPage,
  totalPages,
  totalCount,
}: TransactionsListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isPrivate } = usePrivacyStore();

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`/transactions?${params.toString()}`);
  };

  const handleCategoryChange = async (
    transactionId: string,
    categoryId: string
  ) => {
    await updateTransactionCategory(
      transactionId,
      categoryId === "none" ? null : categoryId
    );
    router.refresh();
  };

  // Group transactions by date
  const groupedTransactions = transactions.reduce((acc, txn) => {
    const date = txn.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(txn);
    return acc;
  }, {} as Record<string, Transaction[]>);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{totalCount} transactions</span>
      </div>

      <Card>
        <CardContent className="p-0">
          {Object.entries(groupedTransactions).map(([date, txns]) => {
            // Calculate daily total (net: income - expenses)
            const dailyTotal = txns.reduce((sum, t) => sum - t.amount, 0);

            return (
              <div key={date}>
                <div className="sticky top-0 bg-muted/50 px-4 py-2 flex items-center justify-between border-b">
                  <span className="text-sm font-medium text-muted-foreground">{formatDate(date)}</span>
                  <span className={`text-sm font-medium tabular-nums ${dailyTotal >= 0 ? "text-green-600" : "text-muted-foreground"}`}>
                    {dailyTotal >= 0 ? "+" : ""}
                    {formatPrivateAmount(dailyTotal, isPrivate)}
                  </span>
                </div>
                <div className="divide-y">
                  {txns.map((txn) => {
                    const merchantName = txn.merchant_name || txn.name;
                    const merchantInitial = merchantName.charAt(0).toUpperCase();
                    // Use category from DB, fallback to Plaid category
                    const displayCategory = txn.category?.name || txn.plaid_category_primary || "Uncategorized";
                    const categoryEmoji = CATEGORY_EMOJIS[displayCategory] || "📋";
                    const accountColor = txn.account ? ACCOUNT_COLORS[txn.account.type] || ACCOUNT_COLORS.other : ACCOUNT_COLORS.other;
                    const isIncome = txn.amount < 0;

                    return (
                      <div
                        key={txn.id}
                        className="flex items-center gap-6 px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer"
                      >
                        {/* Merchant initial */}
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-medium shrink-0">
                          {merchantInitial}
                        </div>

                        {/* Merchant name */}
                        <div className="w-48 min-w-0 shrink-0">
                          <p className="font-medium truncate">{merchantName}</p>
                          {txn.pending && (
                            <Badge variant="outline" className="text-xs mt-0.5">
                              Pending
                            </Badge>
                          )}
                        </div>

                        {/* Category with emoji */}
                        <div className="flex items-center gap-2 w-52 shrink-0">
                          <span className="text-base">{categoryEmoji}</span>
                          <Select
                            value={txn.category?.name || "none"}
                            onValueChange={(value) =>
                              handleCategoryChange(
                                txn.id,
                                value === txn.category?.name
                                  ? categories.find((c) => c.name === value)?.id || "none"
                                  : categories.find((c) => c.name === value)?.id || value
                              )
                            }
                          >
                            <SelectTrigger className="h-7 border-0 bg-transparent hover:bg-muted px-2 -ml-2 text-sm text-muted-foreground">
                              <SelectValue placeholder="Categorize">{displayCategory}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Uncategorized</SelectItem>
                              {categories.map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                  {CATEGORY_EMOJIS[category.name] || "📋"} {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Account with colored dot */}
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className={`h-2.5 w-2.5 rounded-full ${accountColor} shrink-0`} />
                          <span className="text-sm text-muted-foreground truncate">
                            {txn.account?.name || "Unknown"}
                          </span>
                        </div>

                        {/* Amount */}
                        <div className="w-28 text-right shrink-0">
                          <span className={`font-semibold tabular-nums ${isIncome ? "text-green-600" : ""}`}>
                            {isIncome ? "+" : ""}
                            {formatPrivateAmount(Math.abs(txn.amount), isPrivate)}
                          </span>
                        </div>

                        {/* Chevron */}
                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
