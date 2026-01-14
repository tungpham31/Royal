"use client";

import { WidgetConfig, WIDGET_DEFINITIONS, WidgetId } from "@/types/widgets";
import { WidgetGrid } from "@/components/dashboard/widget-grid";
import {
  NetWorthWidget,
  SpendingWidget,
  TransactionsWidget,
} from "@/components/dashboard/widgets";
import { PassiveCashFlowWidget } from "@/components/dashboard/widgets/passive-cash-flow-widget";

interface DashboardClientProps {
  initialLayout: WidgetConfig[];
  currentNetWorth: number;
  netWorthHistory: Array<{
    date: string;
    net_worth: number;
    total_assets: number;
    total_liabilities: number;
  }>;
  spendingHistory: Array<{
    date: string;
    amount: number;
  }>;
  lastMonthHistory: Array<{
    day: number;
    amount: number;
  }>;
  transactions: Array<{
    id: string;
    name: string;
    merchant_name: string | null;
    amount: number;
    date: string;
    plaid_category_primary?: string | null;
  }>;
  passiveCashFlowStats: {
    totalCashFlowAssets: number;
    passiveCashFlow3Pct: number;
    passiveCashFlow4Pct: number;
  };
}

export function DashboardClient({
  initialLayout,
  currentNetWorth,
  netWorthHistory,
  spendingHistory,
  lastMonthHistory,
  transactions,
  passiveCashFlowStats,
}: DashboardClientProps) {
  // Filter out any invalid widget IDs that may exist in saved preferences
  const validLayout = initialLayout.filter((item) => WIDGET_DEFINITIONS[item.id]);

  // Add any missing widgets that were introduced after user saved preferences
  const existingIds = new Set(validLayout.map((item) => item.id));
  const allWidgetIds = Object.keys(WIDGET_DEFINITIONS) as WidgetId[];
  const missingWidgets = allWidgetIds.filter((id) => !existingIds.has(id));

  // Insert missing widgets at their preferred positions
  let completeLayout = [...validLayout];
  missingWidgets.forEach((id) => {
    // Insert passive-cash-flow right after net-worth (position 1)
    if (id === "passive-cash-flow") {
      const netWorthIndex = completeLayout.findIndex((w) => w.id === "net-worth");
      const insertIndex = netWorthIndex >= 0 ? netWorthIndex + 1 : 1;
      completeLayout.splice(insertIndex, 0, { id, visible: true, order: insertIndex });
    } else {
      completeLayout.push({ id, visible: true, order: completeLayout.length });
    }
  });

  // Recalculate order values
  completeLayout = completeLayout.map((w, i) => ({ ...w, order: i }));

  return (
    <WidgetGrid initialLayout={completeLayout} isEditing={false}>
        {({ layout: sortedLayout, renderWidget }) => (
          <div className="space-y-6">
            {sortedLayout.map((config) => {
              switch (config.id) {
                case "net-worth":
                  return renderWidget(
                    "net-worth",
                    <NetWorthWidget
                      history={netWorthHistory}
                      currentNetWorth={currentNetWorth}
                    />,
                    "col-span-2"
                  );
                case "spending":
                  return renderWidget(
                    "spending",
                    <SpendingWidget
                      history={spendingHistory}
                      lastMonthHistory={lastMonthHistory}
                    />,
                    "col-span-2"
                  );
                case "recent-transactions":
                  return renderWidget(
                    "recent-transactions",
                    <TransactionsWidget transactions={transactions} />
                  );
                case "passive-cash-flow":
                  return renderWidget(
                    "passive-cash-flow",
                    <PassiveCashFlowWidget stats={passiveCashFlowStats} />,
                    "col-span-2"
                  );
                default:
                  return null;
              }
            })}
          </div>
        )}
    </WidgetGrid>
  );
}
