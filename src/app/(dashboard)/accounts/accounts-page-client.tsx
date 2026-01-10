"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AccountsList } from "./accounts-list";
import { AccountsNetWorthHeader } from "./accounts-net-worth-header";
import { AccountsSummary } from "./accounts-summary";
import { PlaidLinkButton } from "@/components/plaid/plaid-link";
import { SyncButton } from "@/components/plaid/sync-button";
import { Pencil } from "lucide-react";

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

interface NetWorthHistoryItem {
  date: string;
  net_worth: number;
  total_assets: number;
  total_liabilities: number;
}

interface AccountsPageClientProps {
  accounts: Account[] | null;
  error: string | null;
  history: NetWorthHistoryItem[];
  netWorth: number;
  typeChanges: AccountTypeChange[];
  sectionOrder?: string[];
  plaidItemIds: string[];
}

export function AccountsPageClient({
  accounts,
  error,
  history,
  netWorth,
  typeChanges,
  sectionOrder,
  plaidItemIds,
}: AccountsPageClientProps) {
  const [isEditMode, setIsEditMode] = useState(false);

  return (
    <div className="p-6 space-y-6 overflow-hidden">
      <div className="flex items-center justify-end gap-2">
        <PlaidLinkButton />
        <SyncButton plaidItemIds={plaidItemIds} />
        <Button
          variant={isEditMode ? "secondary" : "outline"}
          size="sm"
          onClick={() => setIsEditMode(!isEditMode)}
        >
          <Pencil className="h-4 w-4" />
          {isEditMode ? "Done" : "Edit"}
        </Button>
      </div>

      {error ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-destructive">{error}</p>
          </CardContent>
        </Card>
      ) : !accounts || accounts.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Connected Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg">No accounts linked yet</p>
              <p className="text-sm mt-2">
                Connect your bank accounts to start tracking your finances
              </p>
              <div className="mt-4">
                <PlaidLinkButton />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Net Worth Header with Chart */}
          <AccountsNetWorthHeader
            history={history}
            currentNetWorth={netWorth}
          />

          {/* Accounts and Summary side by side */}
          <div className="flex flex-col lg:flex-row gap-6 min-w-0">
            {/* Accounts grouped by type */}
            <div className="flex-1 min-w-0">
              <AccountsList
                accounts={accounts}
                typeChanges={typeChanges}
                sectionOrder={sectionOrder}
                isEditMode={isEditMode}
              />
            </div>

            {/* Summary sidebar */}
            <div className="lg:w-[280px] shrink-0">
              <AccountsSummary accounts={accounts} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
