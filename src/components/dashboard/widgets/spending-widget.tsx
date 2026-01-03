"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrivateAmount, MASKED_AMOUNT_SHORT } from "@/lib/utils";
import { usePrivacyStore } from "@/lib/stores/privacy-store";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface SpendingHistoryItem {
  date: string;
  amount: number;
}

interface SpendingWidgetProps {
  history: SpendingHistoryItem[];
}

export function SpendingWidget({ history }: SpendingWidgetProps) {
  const { isPrivate } = usePrivacyStore();

  // Calculate cumulative spending for the month
  const chartData = history.map((item, index) => {
    const cumulativeAmount = history
      .slice(0, index + 1)
      .reduce((sum, h) => sum + h.amount, 0);
    return {
      date: new Date(item.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      daily: item.amount,
      cumulative: cumulativeAmount,
    };
  });

  const totalSpending = history.reduce((sum, item) => sum + item.amount, 0);

  if (history.length === 0) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>This Month&apos;s Spending</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            <p>No spending data this month</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>This Month&apos;s Spending</CardTitle>
          <div className="text-2xl font-bold tabular-nums">
            {formatPrivateAmount(totalSpending, isPrivate)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#525252" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#525252" stopOpacity={0} />
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
                          {formatPrivateAmount(payload[0].payload.cumulative, isPrivate)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {payload[0].payload.date} (Daily: {formatPrivateAmount(payload[0].payload.daily, isPrivate)})
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke="#525252"
                strokeWidth={2}
                fill="url(#spendingGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
