import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function classifyAsset(ticker: string): 'FII' | 'Ações' {
  if (ticker.trim().toUpperCase().endsWith('11')) {
    return 'FII';
  }
  return 'Ações';
}
