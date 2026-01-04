"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPrivateAmount, MASKED_AMOUNT_SHORT } from "@/lib/utils";
import { usePrivacyStore } from "@/lib/stores/privacy-store";
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface Transaction {
  id: string;
  amount: number;
  date: string;
  name: string;
  merchant_name: string | null;
  category_id: string | null;
  pending: boolean;
}

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
  updated_at: string;
  plaid_item?: {
    institution_name: string;
    institution_logo: string | null;
  } | null;
  transactions?: Transaction[];
}

interface AccountDetailClientProps {
  account: Account;
  transactionCount: number;
}

type TimePeriod = "1M" | "3M" | "6M" | "1Y" | "ALL";

const TIME_PERIODS: { value: TimePeriod; label: string; days: number | null }[] = [
  { value: "1M", label: "1 month", days: 30 },
  { value: "3M", label: "3 months", days: 90 },
  { value: "6M", label: "6 months", days: 180 },
  { value: "1Y", label: "1 year", days: 365 },
  { value: "ALL", label: "All time", days: null },
];

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function groupTransactionsByDate(transactions: Transaction[]) {
  const groups: Record<string, Transaction[]> = {};

  transactions.forEach((tx) => {
    const dateKey = tx.date;
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(tx);
  });

  return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
}

export function AccountDetailClient({ account, transactionCount }: AccountDetailClientProps) {
  const { isPrivate } = usePrivacyStore();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("1M");

  const transactions = account.transactions || [];
  const institutionName = account.plaid_item?.institution_name || "Manual";
  const balance = account.current_balance || 0;
  const isLiability = account.type === "credit" || account.type === "loan";
  const displayBalance = isLiability ? -Math.abs(balance) : balance;

  // Generate mock balance history from transactions (simplified)
  const chartData = useMemo(() => {
    const period = TIME_PERIODS.find((p) => p.value === timePeriod);
    const days = period?.days || 365;

    const data: { date: string; value: number }[] = [];
    let runningBalance = balance;
    const today = new Date();

    // Create data points going backwards
    for (let i = 0; i <= days; i += Math.ceil(days / 30)) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      data.unshift({
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        value: runningBalance + (Math.random() - 0.5) * balance * 0.1, // Simulate variation
      });
    }

    // Ensure last point is current balance
    if (data.length > 0) {
      data[data.length - 1].value = balance;
    }

    return data;
  }, [balance, timePeriod]);

  const groupedTransactions = groupTransactionsByDate(transactions);

  // Calculate change (mock for now)
  const change = balance * 0.05;
  const changePercent = 5;
  const isPositive = change >= 0;

  const selectedPeriod = TIME_PERIODS.find((p) => p.value === timePeriod);
  const changeLabel = selectedPeriod?.label || "1 month";

  return (
    <div className="space-y-6">
      {/* Balance Header with Chart */}
      <Card>
        <CardContent className="pt-6">
          {/* Header row */}
          <div className="flex items-start justify-between mb-4">
            <div className="space-y-1">
              <h2 className="text-sm font-medium text-muted-foreground">Current Balance</h2>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold tabular-nums">
                  {formatPrivateAmount(displayBalance, isPrivate)}
                </span>
                <div className="flex items-center gap-1 text-sm">
                  {isPositive ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className={isPositive ? "text-green-500" : "text-red-500"}>
                    {isPositive ? "+" : ""}
                    {formatPrivateAmount(change, isPrivate)} ({changePercent}%)
                  </span>
                  <span className="text-muted-foreground">{changeLabel} change</span>
                </div>
              </div>
            </div>
            <Select
              value={timePeriod}
              onValueChange={(value: TimePeriod) => setTimePeriod(value)}
            >
              <SelectTrigger className="h-8 w-[120px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_PERIODS.map((period) => (
                  <SelectItem key={period.value} value={period.value}>
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Chart */}
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="accountBalanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F97316" stopOpacity={0.5} />
                    <stop offset="50%" stopColor="#F97316" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#F97316" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  className="text-muted-foreground"
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) =>
                    isPrivate ? MASKED_AMOUNT_SHORT : `$${(value / 1000).toFixed(0)}k`
                  }
                  className="text-muted-foreground"
                  width={50}
                  domain={["dataMin - 1000", "dataMax + 1000"]}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="text-sm font-medium">
                            {formatPrivateAmount(payload[0].value as number, isPrivate)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {payload[0].payload.date}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#F97316"
                  strokeWidth={2}
                  fill="url(#accountBalanceGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Transactions and Summary */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Transactions List */}
        <Card className="flex-1 min-w-0">
          <CardHeader>
            <CardTitle className="text-base">Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No transactions found for this account
              </p>
            ) : (
              <div className="space-y-6">
                {groupedTransactions.map(([date, txs]) => (
                  <div key={date}>
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                      <span>{formatDate(date)}</span>
                      <span className="tabular-nums">
                        {formatPrivateAmount(
                          txs.reduce((sum, tx) => sum + tx.amount, 0),
                          isPrivate
                        )}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {txs.map((tx) => (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between py-2"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                                tx.amount < 0 ? "bg-red-100" : "bg-green-100"
                              }`}
                            >
                              {tx.amount < 0 ? (
                                <ArrowUpRight className="h-4 w-4 text-red-600" />
                              ) : (
                                <ArrowDownRight className="h-4 w-4 text-green-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                                {tx.merchant_name || tx.name}
                              </p>
                              {tx.pending && (
                                <span className="text-xs text-muted-foreground">
                                  Pending
                                </span>
                              )}
                            </div>
                          </div>
                          <span
                            className={`font-semibold tabular-nums text-sm ${
                              tx.amount < 0 ? "" : "text-green-600"
                            }`}
                          >
                            {tx.amount < 0 ? "" : "+"}
                            {formatPrivateAmount(Math.abs(tx.amount), isPrivate)}
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

        {/* Summary Sidebar */}
        <Card className="lg:w-[280px] shrink-0 h-fit">
          <CardHeader>
            <CardTitle className="text-base">Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Institution</span>
              <span className="font-medium text-orange-500">{institutionName}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Account type</span>
              <span className="font-medium capitalize">{account.subtype || account.type}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total transactions</span>
              <span className="font-medium tabular-nums">{transactionCount}</span>
            </div>

            <div className="border-t pt-4 mt-4">
              <h4 className="text-sm font-medium mb-3">Connection status</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last update</span>
                  <span className="font-medium">
                    {new Date(account.updated_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium text-green-500">Healthy</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Data provider</span>
                  <span className="font-medium">Plaid</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
