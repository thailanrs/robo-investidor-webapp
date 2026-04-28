"use client";

import React from "react";
import { PortfolioPosition } from "@/lib/portfolio";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatPercent = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "percent", minimumFractionDigits: 2 }).format(value);

export type QuoteData = {
  price: number;
  currency: string;
  change: number;
  changePercent: number;
};

interface PortfolioTableProps {
  positions: PortfolioPosition[];
  quotes: Record<string, QuoteData>;
  isLoadingQuotes: boolean;
}

export function PortfolioTable({ positions, quotes, isLoadingQuotes }: PortfolioTableProps) {
  if (positions.length === 0) {
    return (
      <div className="p-12 text-center bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
        <TrendingUp className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
        <p className="text-zinc-500 dark:text-zinc-400 font-medium">Nenhum ativo em carteira.</p>
        <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">
          Cadastre lançamentos de compra para ver sua posição consolidada.
        </p>
      </div>
    );
  }

  // Se estivermos carregando as cotações, mas já temos posições (evita piscar, usa skeleton)
  // Calcula o total do portfólio usando a cotação atual, ou faz fallback pro custo se não tiver cotação.
  const totalPortfolioValue = positions.reduce((sum, p) => {
    const currentPrice = quotes[p.ticker]?.price || p.avgPrice;
    return sum + (p.quantity * currentPrice);
  }, 0);

  const totalInvested = positions.reduce((sum, p) => sum + p.balance, 0); // p.balance is qty * avgPrice
  const totalProfit = totalPortfolioValue - totalInvested;

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <table className="w-full text-sm text-left">
        <thead className="text-xs uppercase bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
          <tr>
            <th className="px-5 py-4 font-medium">Ativo</th>
            <th className="px-5 py-4 font-medium text-right">Quant.</th>
            <th className="px-5 py-4 font-medium text-right">Preço Médio</th>
            <th className="px-5 py-4 font-medium text-right">Cotação Atual</th>
            <th className="px-5 py-4 font-medium text-right">Saldo Atual</th>
            <th className="px-5 py-4 font-medium text-right">Variação (R$)</th>
            <th className="px-5 py-4 font-medium text-right">Rentabilidade</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {positions.map((pos) => {
            const quote = quotes[pos.ticker];
            const currentPrice = quote?.price || 0;
            const currentBalance = pos.quantity * currentPrice;
            const variation = currentBalance - pos.balance;
            const profitability = pos.avgPrice > 0 ? (currentPrice / pos.avgPrice) - 1 : 0;

            const isPositive = variation > 0;
            const isNegative = variation < 0;
            const isZero = variation === 0;

            return (
              <tr
                key={pos.ticker}
                className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
              >
                <td className="px-5 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        {pos.ticker.substring(0, 2)}
                      </span>
                    </div>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {pos.ticker}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-right text-zinc-900 dark:text-zinc-300">
                  {pos.quantity.toLocaleString("pt-BR")}
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-right text-zinc-900 dark:text-zinc-300">
                  {formatCurrency(pos.avgPrice)}
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-right font-medium">
                  {isLoadingQuotes ? (
                    <Skeleton className="h-5 w-16 ml-auto" />
                  ) : currentPrice > 0 ? (
                    <span className="text-zinc-900 dark:text-zinc-100">{formatCurrency(currentPrice)}</span>
                  ) : (
                    <span className="text-zinc-400 dark:text-zinc-600">—</span>
                  )}
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-right font-medium text-zinc-900 dark:text-zinc-100">
                  {isLoadingQuotes ? (
                    <Skeleton className="h-5 w-24 ml-auto" />
                  ) : currentPrice > 0 ? (
                    formatCurrency(currentBalance)
                  ) : (
                    <span className="text-zinc-400 dark:text-zinc-600">—</span>
                  )}
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-right font-medium">
                  {isLoadingQuotes ? (
                    <Skeleton className="h-5 w-20 ml-auto" />
                  ) : currentPrice > 0 ? (
                    <span
                      className={
                        isPositive
                          ? "text-emerald-600 dark:text-emerald-500"
                          : isNegative
                          ? "text-red-600 dark:text-red-500"
                          : "text-zinc-500 dark:text-zinc-400"
                      }
                    >
                      {variation > 0 ? "+" : ""}{formatCurrency(variation)}
                    </span>
                  ) : (
                    <span className="text-zinc-400 dark:text-zinc-600">—</span>
                  )}
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-right">
                  {isLoadingQuotes ? (
                    <Skeleton className="h-6 w-20 ml-auto rounded-full" />
                  ) : currentPrice > 0 ? (
                    <div className="flex items-center justify-end">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isPositive
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                            : isNegative
                            ? "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                            : "bg-zinc-100 text-zinc-700 dark:bg-zinc-500/10 dark:text-zinc-400"
                        }`}
                      >
                        {isPositive ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : isNegative ? (
                          <TrendingDown className="w-3 h-3" />
                        ) : (
                          <Minus className="w-3 h-3" />
                        )}
                        {profitability > 0 ? "+" : ""}{formatPercent(profitability)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-zinc-400 dark:text-zinc-600">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-300 dark:border-zinc-700">
          <tr className="font-semibold text-zinc-900 dark:text-zinc-100">
            <td className="px-5 py-4 text-sm">
              Total ({positions.length} {positions.length === 1 ? "ativo" : "ativos"})
            </td>
            <td className="px-5 py-4"></td>
            <td className="px-5 py-4"></td>
            <td className="px-5 py-4"></td>
            <td className="px-5 py-4 text-right text-sm">
              {isLoadingQuotes ? <Skeleton className="h-5 w-24 ml-auto" /> : formatCurrency(totalPortfolioValue)}
            </td>
            <td className="px-5 py-4 text-right text-sm">
              {isLoadingQuotes ? (
                <Skeleton className="h-5 w-24 ml-auto" />
              ) : (
                <span
                  className={
                    totalProfit > 0
                      ? "text-emerald-600 dark:text-emerald-500"
                      : totalProfit < 0
                      ? "text-red-600 dark:text-red-500"
                      : "text-zinc-900 dark:text-zinc-100"
                  }
                >
                  {totalProfit > 0 ? "+" : ""}{formatCurrency(totalProfit)}
                </span>
              )}
            </td>
            <td className="px-5 py-4 text-right text-sm">
              {isLoadingQuotes ? (
                <Skeleton className="h-5 w-16 ml-auto" />
              ) : (
                <span
                  className={
                    totalProfit > 0
                      ? "text-emerald-600 dark:text-emerald-500"
                      : totalProfit < 0
                      ? "text-red-600 dark:text-red-500"
                      : "text-zinc-900 dark:text-zinc-100"
                  }
                >
                  {totalInvested > 0 ? formatPercent((totalPortfolioValue / totalInvested) - 1) : "0,00%"}
                </span>
              )}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
