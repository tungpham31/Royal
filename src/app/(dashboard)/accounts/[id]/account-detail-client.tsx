"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPrivateAmount, MASKED_AMOUNT_SHORT } from "@/lib/utils";
import { usePrivacyStore } from "@/lib/stores/privacy-store";
import { updateAccountNickname } from "@/actions/accounts";
import { deleteManualAsset } from "@/actions/manual-assets";
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Pencil, Check, X, Trash2 } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { UpdateValueDialog } from "@/components/accounts/update-value-dialog";
import { REAL_ESTATE_SUBTYPE_LABELS, RealEstateSubtype, LOAN_SUBTYPE_LABELS, LoanSubtype, INVESTMENT_SUBTYPE_LABELS, InvestmentSubtype } from "@/types/database";

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
  nickname?: string | null;
  official_name: string | null;
  type: string;
  subtype: string | null;
  mask: string | null;
  current_balance: number | null;
  available_balance: number | null;
  currency: string;
  updated_at: string;
  is_manual?: boolean;
  plaid_item?: {
    institution_name: string;
    institution_logo: string | null;
  } | null;
  transactions?: Transaction[];
}

interface Valuation {
  id: string;
  valuation_date: string;
  value: number;
  notes: string | null;
  created_at: string;
}

interface AccountDetailClientProps {
  account: Account;
  transactionCount: number;
  valuations?: Valuation[];
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

export function AccountDetailClient({ account, transactionCount, valuations = [] }: AccountDetailClientProps) {
  const router = useRouter();
  const { isPrivate } = usePrivacyStore();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("1M");
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [nickname, setNickname] = useState(account.nickname || "");
  const [isSaving, setIsSaving] = useState(false);
  const [updateValueOpen, setUpdateValueOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isRealEstate = account.type === "real_estate";
  const isManualLoan = account.type === "loan" && account.is_manual;
  const isManualInvestment = account.type === "investment" && account.is_manual;
  const isManualAsset = isRealEstate || isManualLoan || isManualInvestment;

  const handleSaveNickname = async () => {
    setIsSaving(true);
    await updateAccountNickname(account.id, nickname || null);
    setIsSaving(false);
    setIsEditingNickname(false);
  };

  const handleCancelNickname = () => {
    setNickname(account.nickname || "");
    setIsEditingNickname(false);
  };

  const handleDeleteAsset = async () => {
    if (!confirm("Are you sure you want to delete this asset? This action cannot be undone.")) {
      return;
    }
    setIsDeleting(true);
    const result = await deleteManualAsset(account.id);
    if (result.success) {
      router.push("/accounts");
    } else {
      setIsDeleting(false);
      alert("Failed to delete asset");
    }
  };

  const transactions = account.transactions || [];
  const institutionName = account.plaid_item?.institution_name || "Manual";
  const balance = account.current_balance || 0;
  const isLiability = account.type === "credit" || account.type === "loan";
  const displayBalance = isLiability ? -Math.abs(balance) : balance;

  // Generate balance history - use real valuations for real estate and manual investments, mock for others
  const chartData = useMemo(() => {
    const period = TIME_PERIODS.find((p) => p.value === timePeriod);
    const days = period?.days || 365;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // For real estate and manual investments, use actual valuation history
    if ((isRealEstate || isManualInvestment) && valuations.length > 0) {
      const filteredValuations = valuations
        .filter(v => new Date(v.valuation_date) >= cutoffDate)
        .sort((a, b) => new Date(a.valuation_date).getTime() - new Date(b.valuation_date).getTime());

      if (filteredValuations.length === 0) {
        // If no valuations in period, show just the most recent one
        const mostRecent = valuations[0];
        return [{
          date: new Date(mostRecent.valuation_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          value: mostRecent.value,
        }];
      }

      return filteredValuations.map(v => ({
        date: new Date(v.valuation_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        value: v.value,
      }));
    }

    // For other accounts, generate mock data
    const data: { date: string; value: number }[] = [];
    let runningBalance = balance;
    const today = new Date();

    for (let i = 0; i <= days; i += Math.ceil(days / 30)) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      data.unshift({
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        value: runningBalance + (Math.random() - 0.5) * balance * 0.1,
      });
    }

    if (data.length > 0) {
      data[data.length - 1].value = balance;
    }

    return data;
  }, [balance, timePeriod, isRealEstate, isManualInvestment, valuations]);

  const groupedTransactions = groupTransactionsByDate(transactions);

  // Calculate change - use real data for real estate and manual investments, mock for others
  const { change, changePercent, isPositive } = useMemo(() => {
    if ((isRealEstate || isManualInvestment) && valuations.length > 1) {
      const period = TIME_PERIODS.find((p) => p.value === timePeriod);
      const days = period?.days || 365;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      // Find oldest valuation within period
      const sortedInPeriod = valuations
        .filter(v => new Date(v.valuation_date) >= cutoffDate)
        .sort((a, b) => new Date(a.valuation_date).getTime() - new Date(b.valuation_date).getTime());

      if (sortedInPeriod.length > 1) {
        const oldestValue = sortedInPeriod[0].value;
        const currentValue = balance;
        const diff = currentValue - oldestValue;
        const pct = oldestValue > 0 ? (diff / oldestValue) * 100 : 0;
        return {
          change: diff,
          changePercent: Math.abs(pct),
          isPositive: diff >= 0,
        };
      }
    }

    // Mock for other accounts
    return {
      change: balance * 0.05,
      changePercent: 5,
      isPositive: true,
    };
  }, [balance, timePeriod, isRealEstate, isManualInvestment, valuations]);

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
              <h2 className="text-sm font-medium text-muted-foreground">
                {isRealEstate ? "Current Value" : "Current Balance"}
              </h2>
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
                    {isPositive ? "+" : "-"}
                    {formatPrivateAmount(Math.abs(change), isPrivate)} ({changePercent.toFixed(1)}%)
                  </span>
                  <span className="text-muted-foreground">{changeLabel} change</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isManualAsset && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUpdateValueOpen(true)}
                >
                  {isRealEstate ? "Update Value" : "Update Balance"}
                </Button>
              )}
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
        {/* Transactions / Valuation History List */}
        <Card className="flex-1 min-w-0">
          <CardHeader>
            <CardTitle className="text-base">
              {isRealEstate || isManualInvestment ? "Value History" : "Transactions"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isRealEstate || isManualInvestment ? (
              // Valuation history for real estate and manual investments
              valuations.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No valuation history found
                </p>
              ) : (
                <div className="space-y-3">
                  {valuations.map((valuation, index) => {
                    const prevValuation = valuations[index + 1];
                    const changeAmount = prevValuation
                      ? valuation.value - prevValuation.value
                      : 0;
                    const isUp = changeAmount >= 0;

                    return (
                      <div
                        key={valuation.id}
                        className="flex items-center justify-between py-2 border-b last:border-b-0"
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-medium">
                            {formatDate(valuation.valuation_date)}
                          </p>
                          {valuation.notes && (
                            <p className="text-xs text-muted-foreground">
                              {valuation.notes}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold tabular-nums">
                            {formatPrivateAmount(valuation.value, isPrivate)}
                          </p>
                          {prevValuation && changeAmount !== 0 && (
                            <p
                              className={`text-xs tabular-nums ${
                                isUp ? "text-green-500" : "text-red-500"
                              }`}
                            >
                              {isUp ? "+" : ""}
                              {formatPrivateAmount(changeAmount, isPrivate)}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              // Transactions for other accounts
              transactions.length === 0 ? (
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
              )
            )}
          </CardContent>
        </Card>

        {/* Summary Sidebar */}
        <Card className="lg:w-[280px] shrink-0 h-fit">
          <CardHeader>
            <CardTitle className="text-base">Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isRealEstate ? (
              // Real estate summary
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Property Type</span>
                  <span className="font-medium">
                    {account.subtype && REAL_ESTATE_SUBTYPE_LABELS[account.subtype as RealEstateSubtype]
                      ? REAL_ESTATE_SUBTYPE_LABELS[account.subtype as RealEstateSubtype]
                      : "Real Estate"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Value Updates</span>
                  <span className="font-medium tabular-nums">{valuations.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span className="font-medium">
                    {new Date(account.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </>
            ) : isManualLoan ? (
              // Manual loan summary
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Loan Type</span>
                  <span className="font-medium">
                    {account.subtype && LOAN_SUBTYPE_LABELS[account.subtype as LoanSubtype]
                      ? LOAN_SUBTYPE_LABELS[account.subtype as LoanSubtype]
                      : "Loan"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Current Balance</span>
                  <span className="font-medium tabular-nums">
                    {formatPrivateAmount(Math.abs(balance), isPrivate)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span className="font-medium">
                    {new Date(account.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </>
            ) : isManualInvestment ? (
              // Manual investment summary
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Account Type</span>
                  <span className="font-medium">
                    {account.subtype && INVESTMENT_SUBTYPE_LABELS[account.subtype as InvestmentSubtype]
                      ? INVESTMENT_SUBTYPE_LABELS[account.subtype as InvestmentSubtype]
                      : "Investment"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Value Updates</span>
                  <span className="font-medium tabular-nums">{valuations.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span className="font-medium">
                    {new Date(account.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </>
            ) : (
              // Regular account summary
              <>
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
              </>
            )}

            {/* Nickname editing */}
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Nickname</span>
                {!isEditingNickname && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => setIsEditingNickname(true)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                )}
              </div>
              {isEditingNickname ? (
                <div className="space-y-2">
                  <Input
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder={account.name}
                    className="h-8 text-sm"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveNickname();
                      if (e.key === "Escape") handleCancelNickname();
                    }}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="h-7 flex-1"
                      onClick={handleSaveNickname}
                      disabled={isSaving}
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 flex-1"
                      onClick={handleCancelNickname}
                      disabled={isSaving}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-sm">
                  {account.nickname ? (
                    <div>
                      <span className="font-medium">{account.nickname}</span>
                      <p className="text-xs text-muted-foreground mt-1">
                        Original: {account.name}
                      </p>
                    </div>
                  ) : (
                    <span className="text-muted-foreground italic">
                      Using original name
                    </span>
                  )}
                </div>
              )}
            </div>

            {isManualAsset ? (
              // Delete option for manual assets (real estate, loans, and investments)
              <div className="border-t pt-4 mt-4">
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={handleDeleteAsset}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isDeleting ? "Deleting..." : isRealEstate ? "Delete Asset" : isManualLoan ? "Delete Loan" : "Delete Investment"}
                </Button>
              </div>
            ) : (
              // Connection status for regular accounts
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
            )}
          </CardContent>
        </Card>
      </div>

      {/* Update Value Dialog for Manual Assets */}
      {isManualAsset && (
        <UpdateValueDialog
          open={updateValueOpen}
          onOpenChange={setUpdateValueOpen}
          accountId={account.id}
          currentValue={Math.abs(balance)}
        />
      )}
    </div>
  );
}
