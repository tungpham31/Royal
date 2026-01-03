import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { getTransactions, getCategories } from "@/actions/transactions";
import { getAccounts } from "@/actions/accounts";
import { TransactionsList } from "./transactions-list";
import { TransactionsFilters } from "./transactions-filters";

interface TransactionsPageProps {
  searchParams: Promise<{
    page?: string;
    account?: string;
    category?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }>;
}

export default async function TransactionsPage({
  searchParams,
}: TransactionsPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);

  const [transactionsResult, categoriesResult, accountsResult] =
    await Promise.all([
      getTransactions({
        page,
        accountId: params.account,
        categoryId: params.category,
        search: params.search,
        startDate: params.startDate,
        endDate: params.endDate,
      }),
      getCategories(),
      getAccounts(),
    ]);

  const { transactions, totalCount, totalPages } = transactionsResult;
  const { categories } = categoriesResult;
  const { accounts } = accountsResult;

  return (
    <>
      <Header
        title="Transactions"
        description="View and manage your transactions"
      />

      <div className="p-6">
        <TransactionsFilters
          accounts={accounts || []}
          categories={categories || []}
        />

        {!transactions || transactions.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <p className="text-lg">No transactions found</p>
                <p className="text-sm mt-2">
                  {params.search || params.account || params.category
                    ? "Try adjusting your filters"
                    : "Connect a bank account to see your transactions"}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <TransactionsList
            transactions={transactions}
            categories={categories || []}
            currentPage={page}
            totalPages={totalPages || 1}
            totalCount={totalCount || 0}
          />
        )}
      </div>
    </>
  );
}
