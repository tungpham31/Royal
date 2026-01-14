export type WidgetId =
  | "net-worth"
  | "spending"
  | "recent-transactions"
  | "passive-cash-flow";

export type WidgetSize = "small" | "medium" | "large" | "full";

export interface WidgetConfig {
  id: WidgetId;
  visible: boolean;
  order: number;
}

export interface WidgetDefinition {
  id: WidgetId;
  name: string;
  description: string;
  defaultSize: WidgetSize;
  minSize: WidgetSize;
}

export const WIDGET_DEFINITIONS: Record<WidgetId, WidgetDefinition> = {
  "net-worth": {
    id: "net-worth",
    name: "Net Worth",
    description: "Track your net worth over time",
    defaultSize: "large",
    minSize: "medium",
  },
  spending: {
    id: "spending",
    name: "Monthly Spending",
    description: "Your spending over time this month",
    defaultSize: "large",
    minSize: "medium",
  },
  "recent-transactions": {
    id: "recent-transactions",
    name: "Recent Transactions",
    description: "Your latest transactions",
    defaultSize: "medium",
    minSize: "small",
  },
  "passive-cash-flow": {
    id: "passive-cash-flow",
    name: "Passive Cash Flow",
    description: "Track your cash flow assets and passive income",
    defaultSize: "small",
    minSize: "small",
  },
};

export const DEFAULT_WIDGET_LAYOUT: WidgetConfig[] = [
  { id: "net-worth", visible: true, order: 0 },
  { id: "passive-cash-flow", visible: true, order: 1 },
  { id: "spending", visible: true, order: 2 },
  { id: "recent-transactions", visible: true, order: 3 },
];
