import { notFound } from "next/navigation";
import Link from "next/link";
import { getAccountById } from "@/actions/accounts";
import { getAccountDisplayName } from "@/lib/account-utils";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import { AccountDetailClient } from "./account-detail-client";

export const dynamic = "force-dynamic";

interface AccountDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AccountDetailPage({ params }: AccountDetailPageProps) {
  const { id } = await params;
  const { account, transactionCount, error } = await getAccountById(id);

  if (error || !account) {
    notFound();
  }

  const institutionName = account.plaid_item?.institution_name || "Manual";
  const institutionLogo = account.plaid_item?.institution_logo;

  return (
    <>
      <Header
        title={
          <div className="flex items-center gap-2 text-lg">
            <Link href="/accounts" className="text-muted-foreground hover:text-foreground">
              Accounts
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              {institutionLogo ? (
                <img
                  src={`data:image/png;base64,${institutionLogo}`}
                  alt={institutionName}
                  className="h-6 w-6 rounded-full object-contain"
                />
              ) : null}
              <span>{getAccountDisplayName(account)}</span>
            </div>
          </div>
        }
      />

      <div className="p-6">
        <AccountDetailClient
          account={account}
          transactionCount={transactionCount}
        />
      </div>
    </>
  );
}
