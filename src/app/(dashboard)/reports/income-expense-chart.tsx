"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatPrivateAmount, MASKED_AMOUNT_SHORT } from "@/lib/utils";
import { usePrivacyStore } from "@/lib/stores/privacy-store";

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
}

interface IncomeExpenseChartProps {
  data: MonthlyData[];
}

export function IncomeExpenseChart({ data }: IncomeExpenseChartProps) {
  const { isPrivate } = usePrivacyStore();

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) =>
              isPrivate
                ? MASKED_AMOUNT_SHORT
                : new Intl.NumberFormat("en-US", {
                    notation: "compact",
                    compactDisplay: "short",
                    style: "currency",
                    currency: "USD",
                  }).format(value)
            }
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border bg-background p-3 shadow-sm">
                    <p className="text-sm font-medium">{label}</p>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm">
                        <span className="text-muted-foreground">Income: </span>
                        <span className="font-semibold tabular-nums">
                          {formatPrivateAmount(payload[0]?.value as number, isPrivate)}
                        </span>
                      </p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Expenses: </span>
                        <span className="font-semibold tabular-nums">
                          {formatPrivateAmount(payload[1]?.value as number, isPrivate)}
                        </span>
                      </p>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend />
          <Bar dataKey="income" name="Income" fill="#F97316" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expenses" name="Expenses" fill="#525252" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
