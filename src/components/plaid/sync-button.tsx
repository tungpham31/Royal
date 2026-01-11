"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function SyncButton() {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      // Sync all plaid items for the user
      await fetch("/api/plaid/sync-transactions", {
        method: "POST",
      });
      router.refresh();
    } catch (error) {
      console.error("Sync error:", error);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
      <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
      {syncing ? "Syncing..." : "Sync"}
    </Button>
  );
}
