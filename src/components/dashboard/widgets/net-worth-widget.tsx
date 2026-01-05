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

interface NetWorthWidgetProps {
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

export function NetWorthWidget({ history, currentNetWorth }: NetWorthWidgetProps) {
  const { isPrivate } = usePrivacyStore();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("1M");

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

  if (history.length === 0) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Net Worth</span>
            <span className="text-2xl font-bold tabular-nums">
              {formatPrivateAmount(currentNetWorth, isPrivate)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            <p>Track your net worth over time as you add transactions</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle>Net Worth</CardTitle>
            <Select
              value={timePeriod}
              onValueChange={(value: TimePeriod) => setTimePeriod(value)}
            >
              <SelectTrigger className="h-8 w-[120px]">
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
          <div className="text-right">
            <div className="text-2xl font-bold tabular-nums">
              {formatPrivateAmount(currentNetWorth, isPrivate)}
            </div>
            {hasData && (
              <div
                className="flex items-center justify-end gap-1 text-sm text-muted-foreground"
              >
                {isPositive ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span>
                  {isPositive ? "+" : ""}
                  {formatPrivateAmount(change, isPrivate)} ({changePercent}%)
                </span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) =>
                  isPrivate ? MASKED_AMOUNT_SHORT : `$${(value / 1000).toFixed(0)}k`
                }
                className="text-muted-foreground"
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
                fill="url(#netWorthGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
