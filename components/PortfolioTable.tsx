"use client";

import React from "react";
import { PortfolioPosition } from "@/lib/portfolio";
import { TrendingUp } from "lucide-react";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

interface PortfolioTableProps {
  positions: PortfolioPosition[];
}

export function PortfolioTable({ positions }: PortfolioTableProps) {
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

  const totalPortfolio = positions.reduce((sum, p) => sum + p.balance, 0);

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <table className="w-full text-sm text-left">
        <thead className="text-xs uppercase bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
          <tr>
            <th className="px-5 py-4 font-medium">Ativo</th>
            <th className="px-5 py-4 font-medium text-right">Quant.</th>
            <th className="px-5 py-4 font-medium text-right">Preço Médio</th>
            <th className="px-5 py-4 font-medium text-right">Saldo</th>
            <th className="px-5 py-4 font-medium text-right">Custos Acum.</th>
            <th className="px-5 py-4 font-medium text-right">% Carteira</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {positions.map((pos) => {
            const pctCarteira = totalPortfolio > 0
              ? ((pos.balance / totalPortfolio) * 100).toFixed(1)
              : "0.0";

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
                <td className="px-5 py-4 whitespace-nowrap text-right font-medium text-zinc-900 dark:text-zinc-100">
                  {formatCurrency(pos.balance)}
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-right text-zinc-500 dark:text-zinc-400">
                  {pos.totalOtherCosts > 0 ? formatCurrency(pos.totalOtherCosts) : "—"}
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-right">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400">
                    {pctCarteira}%
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
        {/* Footer com totais */}
        <tfoot className="bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-300 dark:border-zinc-700">
          <tr className="font-semibold text-zinc-900 dark:text-zinc-100">
            <td className="px-5 py-4 text-sm">
              Total ({positions.length} {positions.length === 1 ? "ativo" : "ativos"})
            </td>
            <td className="px-5 py-4"></td>
            <td className="px-5 py-4"></td>
            <td className="px-5 py-4 text-right text-sm">
              {formatCurrency(totalPortfolio)}
            </td>
            <td className="px-5 py-4 text-right text-sm text-zinc-500 dark:text-zinc-400">
              {formatCurrency(positions.reduce((sum, p) => sum + p.totalOtherCosts, 0))}
            </td>
            <td className="px-5 py-4 text-right text-sm">100%</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
