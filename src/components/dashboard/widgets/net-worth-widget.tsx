"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export function NetWorthWidget({ history, currentNetWorth }: NetWorthWidgetProps) {
  const { isPrivate } = usePrivacyStore();

  const chartData = history.map((item) => ({
    date: new Date(item.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    value: item.net_worth,
  }));

  // Calculate trend
  const hasData = history.length >= 2;
  const firstValue = history[0]?.net_worth || 0;
  const lastValue = history[history.length - 1]?.net_worth || 0;
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
          <CardTitle>Net Worth</CardTitle>
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
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
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
                stroke="hsl(var(--primary))"
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
