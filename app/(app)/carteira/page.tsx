"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Briefcase, DollarSign, Receipt } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { fetchTransactions } from "@/lib/transactions";
import { calculatePortfolio, PortfolioPosition } from "@/lib/portfolio";
import { PortfolioTable } from "@/components/PortfolioTable";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export default function CarteiraPage() {
  const user = useUser();
  const [positions, setPositions] = useState<PortfolioPosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPortfolio() {
      try {
        const transactions = await fetchTransactions(user.id);
        const portfolio = calculatePortfolio(transactions);
        setPositions(portfolio);
      } catch (err: any) {
        console.error("Erro ao carregar carteira:", err);
        setError("Erro ao carregar carteira: " + err.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadPortfolio();
  }, [user.id]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const totalAtivos = positions.length;
  const totalInvestido = positions.reduce((sum, p) => sum + p.balance, 0);
  const totalCustos = positions.reduce((sum, p) => sum + p.totalOtherCosts, 0);

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-8 mt-4">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Meus Ativos
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          Posição consolidada da sua carteira com base nos lançamentos.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-100/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-md">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total de Ativos */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 flex items-start gap-4">
          <div className="p-2.5 rounded-lg bg-indigo-100 dark:bg-indigo-500/10">
            <Briefcase className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Ativos em Carteira</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-0.5">
              {totalAtivos}
            </p>
          </div>
        </div>

        {/* Valor Investido */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 flex items-start gap-4">
          <div className="p-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-500/10">
            <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Valor Total Investido</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-0.5">
              {formatCurrency(totalInvestido)}
            </p>
          </div>
        </div>

        {/* Outros Custos */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 flex items-start gap-4">
          <div className="p-2.5 rounded-lg bg-amber-100 dark:bg-amber-500/10">
            <Receipt className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Custos Operacionais</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-0.5">
              {formatCurrency(totalCustos)}
            </p>
          </div>
        </div>
      </div>

      {/* Portfolio Table */}
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          Posição Consolidada
        </h2>
        <PortfolioTable positions={positions} />
      </div>
    </div>
  );
}
