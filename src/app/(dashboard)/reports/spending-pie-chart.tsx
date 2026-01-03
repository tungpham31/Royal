"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatPrivateAmount } from "@/lib/utils";
import { usePrivacyStore } from "@/lib/stores/privacy-store";

interface CategoryData {
  name: string;
  total: number;
  color: string;
}

interface SpendingPieChartProps {
  data: CategoryData[];
}

const COLORS = [
  "#F97316",
  "#10B981",
  "#3B82F6",
  "#F59E0B",
  "#EC4899",
  "#8B5CF6",
  "#14B8A6",
  "#EF4444",
];

export function SpendingPieChart({ data }: SpendingPieChartProps) {
  const { isPrivate } = usePrivacyStore();

  const chartData = data.slice(0, 8).map((item, index) => ({
    ...item,
    color: item.color || COLORS[index % COLORS.length],
  }));

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
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
                return (
                  <div className="rounded-lg border bg-background p-3 shadow-sm">
                    <p className="text-sm font-medium">{data.name}</p>
                    <p className="text-sm font-semibold tabular-nums mt-1">
                      {formatPrivateAmount(data.total, isPrivate)}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
