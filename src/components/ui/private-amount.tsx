"use client";

import { formatPrivateAmount, MASKED_AMOUNT } from "@/lib/utils";
import { usePrivacyStore } from "@/lib/stores/privacy-store";

interface PrivateAmountProps {
  amount: number;
  className?: string;
}

export function PrivateAmount({ amount, className }: PrivateAmountProps) {
  const { isPrivate } = usePrivacyStore();

  return (
    <span className={className}>
      {formatPrivateAmount(amount, isPrivate)}
    </span>
  );
}
