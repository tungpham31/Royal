"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
} from "lucide-react";

interface StatsWidgetProps {
  stats: {
    netWorth: number;
    totalAssets: number;
    totalLiabilities: number;
    monthlyIncome: number;
    monthlyExpenses: number;
  };
}

export function StatsWidget({ stats }: StatsWidgetProps) {
  const statCards = [
    {
      title: "Net Worth",
      value: stats.netWorth,
      icon: TrendingUp,
      iconColor: "text-success",
      subtitle: "Assets - Liabilities",
    },
    {
      title: "Total Assets",
      value: stats.totalAssets,
      icon: Wallet,
      iconColor: "text-muted-foreground",
      subtitle: "Across all accounts",
    },
    {
      title: "Monthly Income",
      value: stats.monthlyIncome,
      icon: TrendingUp,
      iconColor: "text-success",
      subtitle: "This month",
      valueColor: "text-success",
      prefix: "+",
    },
    {
      title: "Monthly Expenses",
      value: stats.monthlyExpenses,
      icon: TrendingDown,
      iconColor: "text-destructive",
      subtitle: "This month",
      valueColor: "text-destructive",
      prefix: "-",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold tabular-nums ${stat.valueColor || ""}`}>
              {stat.prefix || ""}{formatCurrency(stat.value)}
            </div>
            <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
