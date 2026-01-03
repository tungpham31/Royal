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
import { ChevronLeft, ChevronRight } from "lucide-react";
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
          {Object.entries(groupedTransactions).map(([date, txns]) => (
            <div key={date}>
              <div className="sticky top-0 bg-muted px-4 py-2 text-sm font-medium">
                {formatDate(date)}
              </div>
              <div className="divide-y">
                {txns.map((txn) => (
                  <div
                    key={txn.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">
                          {txn.merchant_name || txn.name}
                        </p>
                        {txn.pending && (
                          <Badge variant="outline" className="text-xs">
                            Pending
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {txn.account && (
                          <span>
                            {txn.account.name}
                            {txn.account.mask && ` ••${txn.account.mask}`}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <Select
                        value={txn.category?.name || "none"}
                        onValueChange={(value) =>
                          handleCategoryChange(
                            txn.id,
                            value === txn.category?.name
                              ? categories.find((c) => c.name === value)?.id ||
                                  "none"
                              : categories.find((c) => c.name === value)?.id ||
                                  value
                          )
                        }
                      >
                        <SelectTrigger className="w-40 h-8">
                          <SelectValue placeholder="Categorize" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Uncategorized</SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <span className="font-semibold tabular-nums w-24 text-right">
                        {txn.amount > 0 ? "-" : "+"}
                        {formatPrivateAmount(Math.abs(txn.amount), isPrivate)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
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
