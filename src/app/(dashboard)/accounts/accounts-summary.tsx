"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPrivateAmount, MASKED_AMOUNT_SHORT } from "@/lib/utils";
import { usePrivacyStore } from "@/lib/stores/privacy-store";

interface Account {
  id: string;
  name: string;
  type: string;
  current_balance: number | null;
}

interface AccountsSummaryProps {
  accounts: Account[];
}

const ASSET_TYPES = ["depository", "investment", "other"];
const LIABILITY_TYPES = ["credit", "loan"];

const TYPE_LABELS: Record<string, string> = {
  depository: "Cash",
  investment: "Investments",
  credit: "Credit Cards",
  loan: "Loans",
  other: "Other",
};

const TYPE_COLORS: Record<string, string> = {
  depository: "bg-green-500",
  investment: "bg-cyan-500",
  credit: "bg-red-500",
  loan: "bg-amber-500",
  other: "bg-gray-500",
};

type DisplayMode = "totals" | "percent";

export function AccountsSummary({ accounts }: AccountsSummaryProps) {
  const { isPrivate } = usePrivacyStore();
  const [displayMode, setDisplayMode] = useState<DisplayMode>("totals");

  // Calculate totals by type
  const totalsByType = accounts.reduce((acc, account) => {
    const type = account.type || "other";
    const balance = Math.abs(account.current_balance || 0);
    acc[type] = (acc[type] || 0) + balance;
    return acc;
  }, {} as Record<string, number>);

  // Calculate assets and liabilities
  const totalAssets = Object.entries(totalsByType)
    .filter(([type]) => ASSET_TYPES.includes(type))
    .reduce((sum, [, amount]) => sum + amount, 0);

  const totalLiabilities = Object.entries(totalsByType)
    .filter(([type]) => LIABILITY_TYPES.includes(type))
    .reduce((sum, [, amount]) => sum + amount, 0);

  const netWorth = totalAssets - totalLiabilities;

  // Get breakdown for display
  const assetBreakdown = Object.entries(totalsByType)
    .filter(([type]) => ASSET_TYPES.includes(type))
    .filter(([, amount]) => amount > 0)
    .sort((a, b) => b[1] - a[1]);

  const liabilityBreakdown = Object.entries(totalsByType)
    .filter(([type]) => LIABILITY_TYPES.includes(type))
    .filter(([, amount]) => amount > 0)
    .sort((a, b) => b[1] - a[1]);

  // Helper to format value based on display mode
  const formatValue = (amount: number, total: number) => {
    if (displayMode === "percent") {
      if (isPrivate) return MASKED_AMOUNT_SHORT;
      const percent = total > 0 ? (amount / total) * 100 : 0;
      return `${percent.toFixed(1)}%`;
    }
    return formatPrivateAmount(amount, isPrivate);
  };

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Summary</CardTitle>
          <div className="flex rounded-lg border p-0.5">
            <Button
              variant={displayMode === "totals" ? "secondary" : "ghost"}
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => setDisplayMode("totals")}
            >
              Totals
            </Button>
            <Button
              variant={displayMode === "percent" ? "secondary" : "ghost"}
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => setDisplayMode("percent")}
            >
              Percent
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Net Worth */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-muted-foreground">Net Worth</span>
            <span className="text-lg font-bold tabular-nums">
              {formatPrivateAmount(netWorth, isPrivate)}
            </span>
          </div>
        </div>

        {/* Assets */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Assets</span>
            <span className="font-semibold tabular-nums">
              {formatPrivateAmount(totalAssets, isPrivate)}
            </span>
          </div>
          {/* Stacked bar */}
          {totalAssets > 0 && (
            <div className="h-2 rounded-full overflow-hidden flex mb-3">
              {assetBreakdown.map(([type, amount]) => (
                <div
                  key={type}
                  className={`${TYPE_COLORS[type]} first:rounded-l-full last:rounded-r-full`}
                  style={{ width: `${(amount / totalAssets) * 100}%` }}
                />
              ))}
            </div>
          )}
          {/* Breakdown */}
          <div className="space-y-2">
            {assetBreakdown.map(([type, amount]) => (
              <div key={type} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${TYPE_COLORS[type]}`} />
                  <span className="text-muted-foreground">{TYPE_LABELS[type]}</span>
                </div>
                <span className="tabular-nums">
                  {formatValue(amount, totalAssets)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Liabilities */}
        {totalLiabilities > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Liabilities</span>
              <span className="font-semibold tabular-nums">
                {formatPrivateAmount(totalLiabilities, isPrivate)}
              </span>
            </div>
            {/* Stacked bar */}
            <div className="h-2 rounded-full overflow-hidden flex mb-3">
              {liabilityBreakdown.map(([type, amount]) => (
                <div
                  key={type}
                  className={`${TYPE_COLORS[type]} first:rounded-l-full last:rounded-r-full`}
                  style={{ width: `${(amount / totalLiabilities) * 100}%` }}
                />
              ))}
            </div>
            {/* Breakdown */}
            <div className="space-y-2">
              {liabilityBreakdown.map(([type, amount]) => (
                <div key={type} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${TYPE_COLORS[type]}`} />
                    <span className="text-muted-foreground">{TYPE_LABELS[type]}</span>
                  </div>
                  <span className="tabular-nums">
                    {formatValue(amount, totalLiabilities)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
