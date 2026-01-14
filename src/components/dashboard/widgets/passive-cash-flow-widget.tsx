"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrivateAmount } from "@/lib/utils";
import { usePrivacyStore } from "@/lib/stores/privacy-store";
import { Shield, Target } from "lucide-react";

interface PassiveCashFlowWidgetProps {
  stats: {
    totalCashFlowAssets: number;
    passiveCashFlow3Pct: number;
    passiveCashFlow4Pct: number;
  };
}

export function PassiveCashFlowWidget({ stats }: PassiveCashFlowWidgetProps) {
  const { isPrivate } = usePrivacyStore();

  const monthly3Pct = stats.passiveCashFlow3Pct / 12;
  const monthly4Pct = stats.passiveCashFlow4Pct / 12;

  return (
    <Card className="col-span-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Passive Cash Flow</CardTitle>
          <div className="text-right">
            <span className="text-sm text-muted-foreground">Cash Flow Assets</span>
            <div className="text-lg font-semibold tabular-nums">
              {formatPrivateAmount(stats.totalCashFlowAssets, isPrivate)}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {/* Conservative 3% Card */}
          <div className="rounded-xl border p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-5 w-5 text-zinc-500" />
              <span className="text-sm font-medium text-muted-foreground">
                Conservative (3%)
              </span>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold tabular-nums">
                {formatPrivateAmount(stats.passiveCashFlow3Pct, isPrivate)}
                <span className="text-sm font-normal text-muted-foreground">/year</span>
              </div>
              <div className="text-sm tabular-nums text-muted-foreground">
                {formatPrivateAmount(monthly3Pct, isPrivate)}/month
              </div>
            </div>
          </div>

          {/* Standard 4% Card */}
          <div className="rounded-xl border p-4">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-5 w-5 text-orange-500" />
              <span className="text-sm font-medium text-orange-500">
                Standard (4%)
              </span>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold tabular-nums text-orange-500">
                {formatPrivateAmount(stats.passiveCashFlow4Pct, isPrivate)}
                <span className="text-sm font-normal text-muted-foreground">/year</span>
              </div>
              <div className="text-sm tabular-nums text-muted-foreground">
                {formatPrivateAmount(monthly4Pct, isPrivate)}/month
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
