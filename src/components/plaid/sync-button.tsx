"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface SyncButtonProps {
  plaidItemId: string;
}

export function SyncButton({ plaidItemId }: SyncButtonProps) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch("/api/plaid/sync-transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plaid_item_id: plaidItemId }),
      });

      const data = await response.json();
      console.log("Sync result:", data);

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Sync error:", error);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
      <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
      {syncing ? "Syncing..." : "Sync"}
    </Button>
  );
}
