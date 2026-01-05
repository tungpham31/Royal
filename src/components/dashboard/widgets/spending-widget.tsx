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
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

interface SpendingHistoryItem {
  date: string;
  amount: number;
}

interface LastMonthHistoryItem {
  day: number;
  amount: number;
}

interface SpendingWidgetProps {
  history: SpendingHistoryItem[];
  lastMonthHistory: LastMonthHistoryItem[];
}

type ComparisonMode = "vs-last-month" | "this-month-only";

export function SpendingWidget({ history, lastMonthHistory }: SpendingWidgetProps) {
  const { isPrivate } = usePrivacyStore();
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>("vs-last-month");

  // Calculate totals
  const totalSpending = history.length > 0 ? history[history.length - 1].amount : 0;
  const lastMonthTotal = lastMonthHistory.length > 0 ? lastMonthHistory[lastMonthHistory.length - 1].amount : 0;

  // Build chart data - merge current month and last month by day
  const chartData = useMemo(() => {
    const maxDays = Math.max(
      history.length,
      lastMonthHistory.length
    );

    const data: Array<{
      day: number;
      label: string;
      thisMonth: number | null;
      lastMonth: number | null;
    }> = [];

    for (let day = 1; day <= maxDays; day++) {
      const currentItem = history.find((h) => new Date(h.date).getDate() === day);
      const lastItem = lastMonthHistory.find((h) => h.day === day);

      data.push({
        day,
        label: `Day ${day}`,
        thisMonth: currentItem ? currentItem.amount : null,
        lastMonth: lastItem ? lastItem.amount : null,
      });
    }

    return data;
  }, [history, lastMonthHistory]);

  if (history.length === 0 && lastMonthHistory.length === 0) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Spending</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            <p>No spending data this month</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const showComparison = comparisonMode === "vs-last-month";

  return (
    <Card className="col-span-2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle>Spending</CardTitle>
            <Select
              value={comparisonMode}
              onValueChange={(value: ComparisonMode) => setComparisonMode(value)}
            >
              <SelectTrigger className="h-8 w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vs-last-month">This month vs. last month</SelectItem>
                <SelectItem value="this-month-only">This month only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold tabular-nums">
              {formatPrivateAmount(totalSpending, isPrivate)}
            </div>
            {showComparison && lastMonthTotal > 0 && (
              <div className="text-sm text-muted-foreground">
                vs {formatPrivateAmount(lastMonthTotal, isPrivate)} last month
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
                interval="preserveStartEnd"
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
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="text-sm font-medium mb-1">{label}</div>
                        {payload.map((entry, index) => (
                          <div
                            key={index}
                            className="text-xs flex items-center gap-2"
                          >
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-muted-foreground">
                              {entry.name}:
                            </span>
                            <span className="font-medium">
                              {entry.value !== null
                                ? formatPrivateAmount(entry.value as number, isPrivate)
                                : "-"}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {showComparison && (
                <Line
                  type="monotone"
                  dataKey="lastMonth"
                  name="Last month"
                  stroke="#A3A3A3"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  connectNulls
                />
              )}
              <Line
                type="monotone"
                dataKey="thisMonth"
                name="This month"
                stroke="#F97316"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="line"
                formatter={(value) => (
                  <span className="text-sm text-muted-foreground">{value}</span>
                )}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
