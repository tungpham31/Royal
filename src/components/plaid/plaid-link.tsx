"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePlaidLink } from "react-plaid-link";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";

interface PlaidLinkButtonProps {
  onSuccess?: () => void;
}

export function PlaidLinkButton({ onSuccess }: PlaidLinkButtonProps) {
  const router = useRouter();
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const createLinkToken = async () => {
      try {
        const response = await fetch("/api/plaid/create-link-token", {
          method: "POST",
        });
        const data = await response.json();
        setLinkToken(data.link_token);
      } catch (error) {
        console.error("Error creating link token:", error);
      }
    };

    createLinkToken();
  }, []);

  const onPlaidSuccess = useCallback(
    async (publicToken: string, metadata: unknown) => {
      setLoading(true);
      try {
        const response = await fetch("/api/plaid/exchange-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ public_token: publicToken, metadata }),
        });

        if (response.ok) {
          onSuccess?.();
          router.refresh();
        }
      } catch (error) {
        console.error("Error exchanging token:", error);
      } finally {
        setLoading(false);
      }
    },
    [onSuccess, router]
  );

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: onPlaidSuccess,
  });

  return (
    <Button
      onClick={() => open()}
      disabled={!ready || loading}
      className="gap-2"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Plus className="h-4 w-4" />
      )}
      Link Account
    </Button>
  );
}
