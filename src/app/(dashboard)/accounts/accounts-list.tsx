"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  Landmark,
  PiggyBank,
  TrendingUp,
  TrendingDown,
  Wallet,
  ChevronDown,
  ChevronRight,
  Building2,
} from "lucide-react";
import { formatPrivateAmount } from "@/lib/utils";
import { usePrivacyStore } from "@/lib/stores/privacy-store";

interface Account {
  id: string;
  name: string;
  official_name: string | null;
  type: string;
  subtype: string | null;
  mask: string | null;
  current_balance: number | null;
  available_balance: number | null;
  currency: string;
  updated_at: string;
  plaid_item?: {
    institution_name: string;
    institution_logo: string | null;
  } | null;
}

interface AccountTypeChange {
  type: string;
  changeAmount: number;
  changePercent: number;
}

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString();
}

interface AccountsListProps {
  accounts: Account[];
  typeChanges?: AccountTypeChange[];
}

const ACCOUNT_TYPE_ORDER = ["depository", "investment", "credit", "loan", "other"];

const accountTypeIcons: Record<string, React.ReactNode> = {
  depository: <Landmark className="h-5 w-5" />,
  credit: <CreditCard className="h-5 w-5" />,
  investment: <TrendingUp className="h-5 w-5" />,
  loan: <PiggyBank className="h-5 w-5" />,
  other: <Wallet className="h-5 w-5" />,
};

const accountTypeLabels: Record<string, string> = {
  depository: "Cash",
  credit: "Credit Cards",
  investment: "Investments",
  loan: "Loans",
  other: "Other",
};

// Generate a consistent color for an institution name
function getInstitutionColor(name: string): string {
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-cyan-500",
    "bg-indigo-500",
    "bg-teal-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function getInstitutionInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

export function AccountsList({ accounts, typeChanges = [] }: AccountsListProps) {
  const { isPrivate } = usePrivacyStore();
  const [collapsedTypes, setCollapsedTypes] = useState<Set<string>>(new Set());

  // Group accounts by type
  const groupedByType = accounts.reduce((acc, account) => {
    const type = account.type || "other";
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(account);
    return acc;
  }, {} as Record<string, Account[]>);

  // Sort types by defined order
  const sortedTypes = Object.keys(groupedByType).sort((a, b) => {
    const indexA = ACCOUNT_TYPE_ORDER.indexOf(a);
    const indexB = ACCOUNT_TYPE_ORDER.indexOf(b);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  const getTypeTotal = (accounts: Account[], type: string) => {
    return accounts.reduce((total, account) => {
      const balance = account.current_balance || 0;
      // Credit and loan balances are liabilities (show as negative)
      if (type === "credit" || type === "loan") {
        return total - Math.abs(balance);
      }
      return total + balance;
    }, 0);
  };

  const getTypeChange = (type: string) => {
    return typeChanges.find((c) => c.type === type);
  };

  const toggleCollapse = (type: string) => {
    const newCollapsed = new Set(collapsedTypes);
    if (newCollapsed.has(type)) {
      newCollapsed.delete(type);
    } else {
      newCollapsed.add(type);
    }
    setCollapsedTypes(newCollapsed);
  };

  return (
    <div className="space-y-4">
      {sortedTypes.map((type) => {
        const typeAccounts = groupedByType[type];
        const typeTotal = getTypeTotal(typeAccounts, type);
        const typeChange = getTypeChange(type);
        const isCollapsed = collapsedTypes.has(type);
        const isLiability = type === "credit" || type === "loan";

        return (
          <Card key={type}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => toggleCollapse(type)}
                  >
                    {isCollapsed ? (
                      <ChevronRight className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                  <div className="rounded-lg bg-muted p-2">
                    {accountTypeIcons[type] || accountTypeIcons.other}
                  </div>
                  <div>
                    <CardTitle className="text-base">
                      {accountTypeLabels[type] || type}
                    </CardTitle>
                    {typeChange && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        {typeChange.changeAmount >= 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        <span>
                          {typeChange.changeAmount >= 0 ? "+" : ""}
                          {formatPrivateAmount(typeChange.changeAmount, isPrivate)} (
                          {typeChange.changePercent.toFixed(1)}%)
                        </span>
                        <span className="text-muted-foreground/60">1 month change</span>
                      </div>
                    )}
                  </div>
                </div>
                <span className={`text-lg font-semibold tabular-nums ${isLiability && typeTotal < 0 ? "" : ""}`}>
                  {formatPrivateAmount(typeTotal, isPrivate)}
                </span>
              </div>
            </CardHeader>
            {!isCollapsed && (
              <CardContent className="pt-0">
                <div className="divide-y">
                  {typeAccounts.map((account) => {
                    const institutionName = account.plaid_item?.institution_name || "Manual";
                    const institutionLogo = account.plaid_item?.institution_logo;
                    const balance = account.current_balance || 0;
                    const displayBalance = isLiability ? -Math.abs(balance) : balance;

                    return (
                      <Link
                        key={account.id}
                        href={`/accounts/${account.id}`}
                        className="flex items-center justify-between py-3 first:pt-0 last:pb-0 -mx-3 px-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          {/* Institution logo */}
                          {institutionLogo ? (
                            <img
                              src={`data:image/png;base64,${institutionLogo}`}
                              alt={institutionName}
                              className="h-9 w-9 rounded-full object-contain"
                            />
                          ) : (
                            <div
                              className={`flex h-9 w-9 items-center justify-center rounded-full text-white text-sm font-medium ${getInstitutionColor(institutionName)}`}
                            >
                              {institutionName === "Manual" ? (
                                <Building2 className="h-4 w-4" />
                              ) : (
                                getInstitutionInitial(institutionName)
                              )}
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{account.name}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              {account.subtype && (
                                <span className="capitalize">{account.subtype}</span>
                              )}
                              {!account.subtype && <span>{institutionName}</span>}
                              {account.mask && <span>••••{account.mask}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold tabular-nums">
                            {formatPrivateAmount(displayBalance, isPrivate)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {getRelativeTime(account.updated_at)}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
