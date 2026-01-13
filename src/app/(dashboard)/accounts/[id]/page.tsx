import { notFound } from "next/navigation";
import Link from "next/link";
import { getAccountById } from "@/actions/accounts";
import { getAssetValuationHistory } from "@/actions/manual-assets";
import { getAccountDisplayName } from "@/lib/account-utils";
import { Header } from "@/components/layout/header";
import { ChevronRight, Home, Landmark, TrendingUp } from "lucide-react";
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

  const isRealEstate = account.type === "real_estate";
  const isManualLoan = account.type === "loan" && account.is_manual;
  const isManualInvestment = account.type === "investment" && account.is_manual;
  const institutionName = account.plaid_item?.institution_name || "Manual";
  const institutionLogo = account.plaid_item?.institution_logo;

  // Fetch valuation history for real estate and manual investment accounts
  let valuations: { id: string; valuation_date: string; value: number; notes: string | null; created_at: string }[] = [];
  if (isRealEstate || isManualInvestment) {
    const { valuations: fetchedValuations } = await getAssetValuationHistory(id);
    valuations = fetchedValuations || [];
  }

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
              {isRealEstate ? (
                <Home className="h-5 w-5 text-orange-500" />
              ) : isManualLoan ? (
                <Landmark className="h-5 w-5 text-red-500" />
              ) : isManualInvestment ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : institutionLogo ? (
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
          valuations={valuations}
        />
      </div>
    </>
  );
}
