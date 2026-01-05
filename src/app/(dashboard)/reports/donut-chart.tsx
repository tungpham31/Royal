"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatPrivateAmount } from "@/lib/utils";
import { usePrivacyStore } from "@/lib/stores/privacy-store";

interface CategoryData {
  name: string;
  total: number;
  color: string;
}

interface DonutChartProps {
  data: CategoryData[];
  total: number;
  label: string;
  variant?: "spending" | "income";
}

// Monarch-style spending colors
const SPENDING_COLORS = [
  "#F5A5A5", // coral/salmon
  "#F5C9A5", // peach/orange
  "#F5D5A5", // light orange
  "#C8E6C9", // soft mint green
  "#D4E6D5", // lighter mint
  "#E0E6E0", // very light gray-green
  "#E5E5E5", // light gray
  "#ECECEC", // lighter gray
];

// Monarch-style income colors
const INCOME_COLORS = [
  "#9DD9A8", // mint green
  "#7EC889", // darker mint
  "#B8E6C1", // lighter mint
  "#5FB76A", // medium green
  "#D4F0DB", // very light mint
  "#A8D5BA", // sage
];

export function DonutChart({ data, total, label, variant = "spending" }: DonutChartProps) {
  const { isPrivate } = usePrivacyStore();
  const colors = variant === "income" ? INCOME_COLORS : SPENDING_COLORS;

  const chartData = data.slice(0, 8).map((item, index) => ({
    ...item,
    color: item.color || colors[index % colors.length],
  }));

  return (
    <div className="relative h-52">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="total"
            nameKey="name"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                const percentage = total > 0 ? ((data.total / total) * 100).toFixed(1) : 0;
                return (
                  <div className="rounded-lg border bg-background p-3 shadow-sm">
                    <p className="text-sm font-medium">{data.name}</p>
                    <p className="text-sm font-semibold tabular-nums mt-1">
                      {formatPrivateAmount(data.total, isPrivate)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {percentage}% of total
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Center Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <p className="text-2xl font-bold tabular-nums">
          {formatPrivateAmount(total, isPrivate)}
        </p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
