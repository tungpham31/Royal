"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, ArrowUpDown } from "lucide-react";
import { getAccountDisplayName } from "@/lib/account-utils";

interface Account {
  id: string;
  name: string;
  nickname?: string | null;
  mask: string | null;
}

interface Category {
  id: string;
  name: string;
}

interface TransactionsFiltersProps {
  accounts: Account[];
  categories: Category[];
}

export function TransactionsFilters({
  accounts,
  categories,
}: TransactionsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(
    searchParams.get("search") || ""
  );

  const createQueryString = useCallback(
    (params: Record<string, string | null>) => {
      const current = new URLSearchParams(searchParams.toString());

      Object.entries(params).forEach(([key, value]) => {
        if (value === null || value === "") {
          current.delete(key);
        } else {
          current.set(key, value);
        }
      });

      // Reset to page 1 when filters change
      if (!params.page) {
        current.delete("page");
      }

      return current.toString();
    },
    [searchParams]
  );

  const handleAccountChange = (value: string) => {
    router.push(
      `/transactions?${createQueryString({
        account: value === "all" ? null : value,
      })}`
    );
  };

  const handleCategoryChange = (value: string) => {
    router.push(
      `/transactions?${createQueryString({
        category: value === "all" ? null : value,
      })}`
    );
  };

  const handleSortChange = (value: string) => {
    router.push(
      `/transactions?${createQueryString({
        sort: value === "date_desc" ? null : value,
      })}`
    );
  };

  const handleSearch = () => {
    router.push(
      `/transactions?${createQueryString({
        search: searchValue || null,
      })}`
    );
  };

  const clearFilters = () => {
    setSearchValue("");
    router.push("/transactions");
  };

  const hasFilters =
    searchParams.get("account") ||
    searchParams.get("category") ||
    searchParams.get("search") ||
    searchParams.get("sort");

  return (
    <div className="mb-6 flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search transactions..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="w-64"
        />
        <Button size="icon" variant="outline" onClick={handleSearch}>
          <Search className="h-4 w-4" />
        </Button>
      </div>

      <Select
        value={searchParams.get("account") || "all"}
        onValueChange={handleAccountChange}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="All Accounts" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Accounts</SelectItem>
          {accounts.map((account) => (
            <SelectItem key={account.id} value={account.id}>
              {getAccountDisplayName(account)} {account.mask && `(••${account.mask})`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("category") || "all"}
        onValueChange={handleCategoryChange}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("sort") || "date_desc"}
        onValueChange={handleSortChange}
      >
        <SelectTrigger className="w-40">
          <ArrowUpDown className="h-4 w-4 mr-2" />
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="date_desc">Newest first</SelectItem>
          <SelectItem value="date_asc">Oldest first</SelectItem>
          <SelectItem value="amount_desc">Highest amount</SelectItem>
          <SelectItem value="amount_asc">Lowest amount</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="mr-2 h-4 w-4" />
          Clear filters
        </Button>
      )}
    </div>
  );
}
