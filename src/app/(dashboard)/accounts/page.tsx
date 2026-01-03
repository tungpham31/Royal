import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAccounts } from "@/actions/accounts";
import { AccountsList } from "./accounts-list";
import { PlaidLinkButton } from "@/components/plaid/plaid-link";
import { SyncButton } from "@/components/plaid/sync-button";
import { createClient } from "@/lib/supabase/server";

export default async function AccountsPage() {
  const { accounts, error } = await getAccounts();

  // Get plaid items for sync buttons
  const supabase = await createClient();
  const { data: plaidItems } = await supabase
    .from("plaid_items")
    .select("id, institution_name")
    .returns<{ id: string; institution_name: string }[]>();

  const groupedAccounts = accounts?.reduce((acc, account) => {
    const institutionName = account.plaid_item?.institution_name || "Manual";
    if (!acc[institutionName]) {
      acc[institutionName] = [];
    }
    acc[institutionName].push(account);
    return acc;
  }, {} as Record<string, typeof accounts>);

  return (
    <>
      <Header
        title="Accounts"
        description="Manage your connected accounts"
      />

      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <SyncButton plaidItemIds={plaidItems?.map((item) => item.id) || []} />
          <PlaidLinkButton />
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
          <AccountsList groupedAccounts={groupedAccounts || {}} />
        )}
      </div>
    </>
  );
}
