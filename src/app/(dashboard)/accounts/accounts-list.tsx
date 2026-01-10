"use client";

import { useState, useCallback, useEffect, useId } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronRight,
  Building2,
  EyeOff,
  Eye,
  MoreHorizontal,
  GripVertical,
} from "lucide-react";
import { formatPrivateAmount, cn } from "@/lib/utils";
import { getAccountDisplayName } from "@/lib/account-utils";
import { usePrivacyStore } from "@/lib/stores/privacy-store";
import { SortableAccountGroup } from "./sortable-account-group";
import { SortableAccountItem } from "./sortable-account-item";
import { SortableSection } from "./sortable-section";
import { toggleAccountHidden, updateSectionOrder } from "@/actions/accounts";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis, restrictToParentElement } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { DragOverlay } from "@dnd-kit/core";

interface Account {
  id: string;
  name: string;
  nickname?: string | null;
  official_name: string | null;
  type: string;
  subtype: string | null;
  mask: string | null;
  current_balance: number | null;
  available_balance: number | null;
  currency: string;
  display_order?: number;
  is_hidden?: boolean;
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
  sectionOrder?: string[];
  isEditMode: boolean;
}

const DEFAULT_SECTION_ORDER = ["depository", "investment", "credit", "loan", "other"];

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

export function AccountsList({ accounts, typeChanges = [], sectionOrder: initialSectionOrder, isEditMode }: AccountsListProps) {
  const { isPrivate } = usePrivacyStore();
  const [collapsedTypes, setCollapsedTypes] = useState<Set<string>>(new Set());
  const [showHiddenByType, setShowHiddenByType] = useState<Set<string>>(new Set());
  const [sectionOrder, setSectionOrder] = useState<string[]>(initialSectionOrder || DEFAULT_SECTION_ORDER);
  const [isMounted, setIsMounted] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const sectionDndId = useId();

  // For hydration safety
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update section order when prop changes
  useEffect(() => {
    if (initialSectionOrder) {
      setSectionOrder(initialSectionOrder);
    }
  }, [initialSectionOrder]);

  // Sensors for section drag and drop
  const sectionSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle section drag start (for debugging)
  const handleSectionDragStart = useCallback((event: DragStartEvent) => {
    console.log("[Section DnD] dragStart - active:", event.active.id);
    setActiveSection(event.active.id as string);
  }, []);

  // Handle section drag over (for debugging)
  const handleSectionDragOver = useCallback((event: DragOverEvent) => {
    console.log("[Section DnD] dragOver - active:", event.active.id, "over:", event.over?.id);
  }, []);

  // Handle section drag cancel
  const handleSectionDragCancel = useCallback(() => {
    console.log("[Section DnD] dragCancel");
    setActiveSection(null);
  }, []);

  // Handle section reorder
  const handleSectionDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    console.log("[Section DnD] dragEnd - active:", active?.id, "over:", over?.id);
    setActiveSection(null);
    if (!over) {
      console.log("[Section DnD] No drop target (over is null)");
      return;
    }
    if (active.id === over.id) {
      console.log("[Section DnD] Dropped on same element");
      return;
    }
    console.log("[Section DnD] Reordering from", active.id, "to", over.id);
    setSectionOrder((prev) => {
      const oldIndex = prev.indexOf(active.id as string);
      const newIndex = prev.indexOf(over.id as string);
      const newOrder = arrayMove(prev, oldIndex, newIndex);
      console.log("[Section DnD] New order:", newOrder);
      // Fire and forget - persist to server
      updateSectionOrder(newOrder);
      return newOrder;
    });
  }, []);

  // Helper to group and sort accounts by type and display_order
  const groupAccountsByType = (accountsList: Account[]) => {
    const grouped = accountsList.reduce((acc, account) => {
      const type = account.type || "other";
      if (!acc[type]) acc[type] = [];
      acc[type].push(account);
      return acc;
    }, {} as Record<string, Account[]>);

    // Sort accounts within each type by display_order, with hidden accounts at the end
    Object.keys(grouped).forEach((type) => {
      grouped[type].sort((a, b) => {
        // Hidden accounts go to the end
        if (a.is_hidden && !b.is_hidden) return 1;
        if (!a.is_hidden && b.is_hidden) return -1;
        // Then sort by display_order
        return (a.display_order ?? 999) - (b.display_order ?? 999);
      });
    });

    return grouped;
  };

  // State for account ordering (enables optimistic updates)
  const [accountsByType, setAccountsByType] = useState<Record<string, Account[]>>(() => {
    return groupAccountsByType(accounts);
  });

  // Update state when accounts prop changes
  useEffect(() => {
    setAccountsByType(groupAccountsByType(accounts));
  }, [accounts]);

  // Handler for reordering within a type
  const handleReorder = useCallback((type: string, newAccounts: Account[]) => {
    setAccountsByType((prev) => ({
      ...prev,
      [type]: newAccounts,
    }));
  }, []);

  // Toggle showing hidden accounts for a type
  const toggleShowHidden = (type: string) => {
    setShowHiddenByType((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  };

  // Handle hiding/unhiding an account with optimistic update
  const handleToggleHidden = useCallback((e: React.MouseEvent, accountId: string) => {
    e.preventDefault();
    e.stopPropagation();

    // Optimistic update: immediately toggle is_hidden in local state
    setAccountsByType((prev) => {
      const newState: Record<string, Account[]> = {};

      for (const [type, accounts] of Object.entries(prev)) {
        newState[type] = accounts.map((account) => {
          if (account.id === accountId) {
            return { ...account, is_hidden: !account.is_hidden };
          }
          return account;
        });

        // Re-sort so hidden accounts go to the end
        newState[type].sort((a, b) => {
          if (a.is_hidden && !b.is_hidden) return 1;
          if (!a.is_hidden && b.is_hidden) return -1;
          return (a.display_order ?? 999) - (b.display_order ?? 999);
        });
      }

      return newState;
    });

    // Fire and forget - server action will revalidate paths
    toggleAccountHidden(accountId);
  }, []);

  // Sort types by user's section order
  const sortedTypes = Object.keys(accountsByType).sort((a, b) => {
    const indexA = sectionOrder.indexOf(a);
    const indexB = sectionOrder.indexOf(b);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  const getTypeTotal = (accounts: Account[], type: string) => {
    return accounts
      .filter((account) => !account.is_hidden)
      .reduce((total, account) => {
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

  // Don't render DnD until mounted to prevent hydration issues
  if (!isMounted) {
    return (
      <div className="space-y-4">
        {sortedTypes.map((type) => {
          const typeAccounts = accountsByType[type];
          const typeTotal = getTypeTotal(typeAccounts, type);
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
                    <CardTitle className="text-lg font-semibold">
                      {accountTypeLabels[type] || type}
                    </CardTitle>
                  </div>
                  <span className="text-lg font-semibold tabular-nums mr-10">
                    {formatPrivateAmount(typeTotal, isPrivate)}
                  </span>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    );
  }

  return (
    <DndContext
      id={sectionDndId}
      sensors={sectionSensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragStart={handleSectionDragStart}
      onDragOver={handleSectionDragOver}
      onDragEnd={handleSectionDragEnd}
      onDragCancel={handleSectionDragCancel}
    >
      <SortableContext items={sortedTypes} strategy={verticalListSortingStrategy}>
        <div className="space-y-4">
          {sortedTypes.map((type) => {
            const typeAccounts = accountsByType[type];
            const typeTotal = getTypeTotal(typeAccounts, type);
            const typeChange = getTypeChange(type);
            const isCollapsed = collapsedTypes.has(type);
            const isLiability = type === "credit" || type === "loan";

            return (
              <SortableSection key={type} id={type} isEditMode={isEditMode}>
                {(dragHandle) => (
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {dragHandle}
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
                          <div>
                            <CardTitle className="text-lg font-semibold">
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
                        <span className="text-lg font-semibold tabular-nums mr-10">
                          {formatPrivateAmount(typeTotal, isPrivate)}
                        </span>
                      </div>
                    </CardHeader>
            {!isCollapsed && (() => {
              const visibleAccounts = typeAccounts.filter((a) => !a.is_hidden);
              const hiddenAccounts = typeAccounts.filter((a) => a.is_hidden);
              const showHidden = showHiddenByType.has(type);

              return (
                <CardContent className="pt-0 pl-10">
                  <SortableAccountGroup
                    accounts={visibleAccounts}
                    onReorder={(newAccounts) => handleReorder(type, newAccounts)}
                  >
                    <div className="divide-y">
                      {visibleAccounts.map((account) => {
                        const institutionName = account.plaid_item?.institution_name || "Manual";
                        const institutionLogo = account.plaid_item?.institution_logo;
                        const balance = account.current_balance || 0;
                        const displayBalance = isLiability ? -Math.abs(balance) : balance;

                        return (
                          <SortableAccountItem key={account.id} id={account.id} isEditMode={isEditMode}>
                            <div className="flex items-center justify-between py-4 -mx-3 px-3 rounded-lg hover:bg-muted/50 transition-colors group/row">
                              <Link
                                href={`/accounts/${account.id}`}
                                className="flex items-center gap-4 flex-1 min-w-0"
                              >
                                {/* Institution logo */}
                                {institutionLogo ? (
                                  <img
                                    src={`data:image/png;base64,${institutionLogo}`}
                                    alt={institutionName}
                                    className="h-11 w-11 rounded-full object-contain"
                                  />
                                ) : (
                                  <div
                                    className={`flex h-11 w-11 items-center justify-center rounded-full text-white font-medium ${getInstitutionColor(institutionName)}`}
                                  >
                                    {institutionName === "Manual" ? (
                                      <Building2 className="h-5 w-5" />
                                    ) : (
                                      getInstitutionInitial(institutionName)
                                    )}
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium text-base">{getAccountDisplayName(account)}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {account.subtype ? (
                                      <span className="capitalize">{account.subtype}</span>
                                    ) : (
                                      <span>{institutionName}</span>
                                    )}
                                  </p>
                                </div>
                              </Link>
                              <div className="flex items-center gap-2">
                                <Link href={`/accounts/${account.id}`} className="text-right">
                                  <p className="font-semibold text-base tabular-nums">
                                    {formatPrivateAmount(displayBalance, isPrivate)}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {getRelativeTime(account.updated_at)}
                                  </p>
                                </Link>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 opacity-0 group-hover/row:opacity-100 transition-opacity"
                                      onClick={(e) => e.preventDefault()}
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={(e) => handleToggleHidden(e, account.id)}>
                                      <EyeOff className="h-4 w-4 mr-2" />
                                      Hide account
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </SortableAccountItem>
                        );
                      })}
                    </div>
                  </SortableAccountGroup>

                  {/* Hidden accounts section */}
                  {hiddenAccounts.length > 0 && (
                    <div className="mt-2">
                      <button
                        onClick={() => toggleShowHidden(type)}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                      >
                        <EyeOff className="h-4 w-4" />
                        {showHidden ? "Collapse" : "Show"} {hiddenAccounts.length} hidden account{hiddenAccounts.length > 1 ? "s" : ""}
                      </button>

                      {showHidden && (
                        <div className="divide-y">
                          {hiddenAccounts.map((account) => {
                            const institutionName = account.plaid_item?.institution_name || "Manual";
                            const institutionLogo = account.plaid_item?.institution_logo;
                            const balance = account.current_balance || 0;
                            const displayBalance = isLiability ? -Math.abs(balance) : balance;

                            return (
                              <div
                                key={account.id}
                                className="flex items-center justify-between py-4 -mx-3 px-3 rounded-lg hover:bg-muted/50 transition-colors opacity-60 group/row"
                              >
                                <Link
                                  href={`/accounts/${account.id}`}
                                  className="flex items-center gap-4 flex-1 min-w-0"
                                >
                                  {/* Institution logo */}
                                  {institutionLogo ? (
                                    <img
                                      src={`data:image/png;base64,${institutionLogo}`}
                                      alt={institutionName}
                                      className="h-11 w-11 rounded-full object-contain grayscale"
                                    />
                                  ) : (
                                    <div
                                      className={cn(
                                        "flex h-11 w-11 items-center justify-center rounded-full text-white font-medium",
                                        getInstitutionColor(institutionName),
                                        "grayscale"
                                      )}
                                    >
                                      {institutionName === "Manual" ? (
                                        <Building2 className="h-5 w-5" />
                                      ) : (
                                        getInstitutionInitial(institutionName)
                                      )}
                                    </div>
                                  )}
                                  <div>
                                    <p className="font-medium text-base">{getAccountDisplayName(account)}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {account.subtype ? (
                                        <span className="capitalize">{account.subtype}</span>
                                      ) : (
                                        <span>{institutionName}</span>
                                      )}
                                    </p>
                                  </div>
                                </Link>
                                <div className="flex items-center gap-2">
                                  <Link href={`/accounts/${account.id}`} className="text-right flex items-center gap-2">
                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                      <p className="font-semibold text-base tabular-nums">
                                        {formatPrivateAmount(displayBalance, isPrivate)}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        {getRelativeTime(account.updated_at)}
                                      </p>
                                    </div>
                                  </Link>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 opacity-0 group-hover/row:opacity-100 transition-opacity"
                                        onClick={(e) => e.preventDefault()}
                                      >
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={(e) => handleToggleHidden(e, account.id)}>
                                        <Eye className="h-4 w-4 mr-2" />
                                        Unhide account
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                    </CardContent>
                  );
                })()}
                  </Card>
                )}
              </SortableSection>
            );
          })}
        </div>
      </SortableContext>
      <DragOverlay>
        {activeSection ? (
          <Card className="shadow-xl opacity-90">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-lg font-semibold">
                  {accountTypeLabels[activeSection] || activeSection}
                </CardTitle>
              </div>
            </CardHeader>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
