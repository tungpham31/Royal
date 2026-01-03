"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatPrivateAmount, MASKED_AMOUNT_SHORT } from "@/lib/utils";
import { usePrivacyStore } from "@/lib/stores/privacy-store";

interface NetWorthHistoryItem {
  date: string;
  net_worth: number;
  total_assets: number;
  total_liabilities: number;
}

interface NetWorthChartProps {
  data: NetWorthHistoryItem[];
}

export function NetWorthChart({ data }: NetWorthChartProps) {
  const { isPrivate } = usePrivacyStore();

  const chartData = data.map((item) => ({
    date: new Date(item.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    netWorth: item.net_worth,
    assets: item.total_assets,
    liabilities: item.total_liabilities,
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
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
              isPrivate
                ? MASKED_AMOUNT_SHORT
                : new Intl.NumberFormat("en-US", {
                    notation: "compact",
                    compactDisplay: "short",
                    style: "currency",
                    currency: "USD",
                  }).format(value)
            }
            className="text-muted-foreground"
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="rounded-lg border bg-background p-3 shadow-sm">
                    <p className="text-sm font-medium">{data.date}</p>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm">
                        <span className="text-muted-foreground">Net Worth: </span>
                        <span className="font-semibold tabular-nums">
                          {formatPrivateAmount(data.netWorth, isPrivate)}
                        </span>
                      </p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Assets: </span>
                        <span className="font-semibold tabular-nums">
                          {formatPrivateAmount(data.assets, isPrivate)}
                        </span>
                      </p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Liabilities: </span>
                        <span className="font-semibold tabular-nums">
                          {formatPrivateAmount(data.liabilities, isPrivate)}
                        </span>
                      </p>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="netWorth"
            stroke="#F97316"
            strokeWidth={2}
            fill="url(#netWorthGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
