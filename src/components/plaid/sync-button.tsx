"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface SyncButtonProps {
  plaidItemIds: string[];
}

export function SyncButton({ plaidItemIds }: SyncButtonProps) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    if (plaidItemIds.length === 0) return;

    setSyncing(true);
    try {
      // Sync all plaid items
      await Promise.all(
        plaidItemIds.map((plaidItemId) =>
          fetch("/api/plaid/sync-transactions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ plaid_item_id: plaidItemId }),
          })
        )
      );
      router.refresh();
    } catch (error) {
      console.error("Sync error:", error);
    } finally {
      setSyncing(false);
    }
  };

  if (plaidItemIds.length === 0) return null;

  return (
    <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
      <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
      {syncing ? "Syncing..." : "Sync"}
    </Button>
  );
}
