import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function classifyAsset(ticker: string): string {
  if (!ticker) return "Ações";
  const upperTicker = ticker.toUpperCase();
  // FIIs in Brazil typically end with "11" or "12"
  if (upperTicker.endsWith("11") || upperTicker.endsWith("12")) {
    return "FIIs";
  }
  return "Ações";
}
