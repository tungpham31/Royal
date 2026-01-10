"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPrivateAmount, MASKED_AMOUNT_SHORT } from "@/lib/utils";
import { usePrivacyStore } from "@/lib/stores/privacy-store";
import { TrendingUp, TrendingDown } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface NetWorthHistoryItem {
  date: string;
  net_worth: number;
  total_assets: number;
  total_liabilities: number;
}

interface AccountsNetWorthHeaderProps {
  history: NetWorthHistoryItem[];
  currentNetWorth: number;
}

type TimePeriod = "1M" | "3M" | "6M" | "1Y" | "ALL";

const TIME_PERIODS: { value: TimePeriod; label: string; days: number | null }[] = [
  { value: "1M", label: "1 month", days: 30 },
  { value: "3M", label: "3 months", days: 90 },
  { value: "6M", label: "6 months", days: 180 },
  { value: "1Y", label: "1 year", days: 365 },
  { value: "ALL", label: "All time", days: null },
];

export function AccountsNetWorthHeader({
  history,
  currentNetWorth,
}: AccountsNetWorthHeaderProps) {
  const { isPrivate } = usePrivacyStore();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("1M");
  const [isMounted, setIsMounted] = useState(false);

  // Prevent SSR rendering of chart to avoid dimension warnings
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Filter history based on selected time period
  const filteredHistory = useMemo(() => {
    const period = TIME_PERIODS.find((p) => p.value === timePeriod);
    if (!period || period.days === null) {
      return history;
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - period.days);
    const cutoffStr = cutoffDate.toISOString().split("T")[0];

    return history.filter((item) => item.date >= cutoffStr);
  }, [history, timePeriod]);

  const chartData = filteredHistory.map((item) => ({
    date: new Date(item.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    value: item.net_worth,
  }));

  // Calculate trend based on filtered data
  const hasData = filteredHistory.length >= 2;
  const firstValue = filteredHistory[0]?.net_worth || 0;
  const lastValue = filteredHistory[filteredHistory.length - 1]?.net_worth || 0;
  const change = lastValue - firstValue;
  const changePercent = firstValue !== 0 ? ((change / firstValue) * 100).toFixed(1) : "0";
  const isPositive = change >= 0;

  const selectedPeriod = TIME_PERIODS.find((p) => p.value === timePeriod);
  const changeLabel = selectedPeriod?.label || "1 month";

  return (
    <Card>
      <CardContent className="pt-6">
        {/* Header row with Net Worth value and time selector */}
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-1">
            <h2 className="text-sm font-medium text-muted-foreground">Net Worth</h2>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold tabular-nums">
                {formatPrivateAmount(currentNetWorth, isPrivate)}
              </span>
              {hasData && (
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
              )}
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

        {/* Full-width Chart */}
        <div className="h-[200px] w-full">
          {history.length > 0 && isMounted ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="accountsNetWorthGradient" x1="0" y1="0" x2="0" y2="1">
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
                  fill="url(#accountsNetWorthGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
              Net worth history will appear here
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
