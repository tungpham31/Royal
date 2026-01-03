import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Privacy mode masking constants
export const MASKED_AMOUNT = "$•••••";
export const MASKED_AMOUNT_SHORT = "$•••";

export function formatCurrency(
  amount: number,
  currency: string = "USD",
  locale: string = "en-US"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPrivateAmount(
  amount: number,
  isPrivate: boolean,
  currency: string = "USD",
  locale: string = "en-US"
): string {
  if (isPrivate) {
    return MASKED_AMOUNT;
  }
  return formatCurrency(amount, currency, locale);
}

export function formatPrivateCompact(
  value: number,
  isPrivate: boolean
): string {
  if (isPrivate) {
    return MASKED_AMOUNT_SHORT;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  }
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", options);
}
