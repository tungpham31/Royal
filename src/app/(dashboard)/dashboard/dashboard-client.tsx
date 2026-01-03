"use client";

import { WidgetConfig, WIDGET_DEFINITIONS } from "@/types/widgets";
import { WidgetGrid } from "@/components/dashboard/widget-grid";
import {
  NetWorthWidget,
  SpendingWidget,
  TransactionsWidget,
} from "@/components/dashboard/widgets";

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
  transactions: Array<{
    id: string;
    name: string;
    merchant_name: string | null;
    amount: number;
    date: string;
    plaid_category_primary?: string | null;
  }>;
}

export function DashboardClient({
  initialLayout,
  currentNetWorth,
  netWorthHistory,
  spendingHistory,
  transactions,
}: DashboardClientProps) {
  // Filter out any invalid widget IDs that may exist in saved preferences
  const validLayout = initialLayout.filter((item) => WIDGET_DEFINITIONS[item.id]);

  return (
    <WidgetGrid initialLayout={validLayout} isEditing={false}>
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
                    <SpendingWidget history={spendingHistory} />,
                    "col-span-2"
                  );
                case "recent-transactions":
                  return renderWidget(
                    "recent-transactions",
                    <TransactionsWidget transactions={transactions} />
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
