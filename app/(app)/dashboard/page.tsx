"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { fetchTransactions } from "@/lib/transactions";
import { calculatePortfolio, PortfolioPosition } from "@/lib/portfolio";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { EvolutionChart } from "@/components/dashboard/EvolutionChart";
import { PortfolioPieChart } from "@/components/dashboard/PortfolioPieChart";
import { PerformanceComparisonChart } from "@/components/dashboard/PerformanceComparisonChart";

export default function DashboardPage() {
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

  // Calculate Metrics based on portfolio positions
  const valorInvestido = positions.reduce((sum, p) => sum + p.totalInvested, 0);
  const patrimonioTotal = positions.reduce((sum, p) => sum + p.balance, 0);
  const ganhoCapital = patrimonioTotal - valorInvestido;

  // Dummy values for demonstration of the fields requested that aren't strictly calculable with current transactions
  const dividendos = 4754.50;
  const proventos12M = 2722.91;
  const proventosTotal = 4754.50;

  const lucroTotal = ganhoCapital + dividendos;
  const variacaoValor = ganhoCapital;
  const variacaoPercent = valorInvestido > 0 ? (ganhoCapital / valorInvestido) * 100 : 0;

  // Placeholder for time-weighted return (Rentabilidade Ponderada)
  const rentabilidadePercent = 39.62;

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-8 mt-4">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Dashboard
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          Visão geral do seu patrimônio e evolução.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-100/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-md">
          {error}
        </div>
      )}

      {/* Dashboard Stats */}
      <DashboardStats
        patrimonioTotal={patrimonioTotal}
        valorInvestido={valorInvestido}
        lucroTotal={lucroTotal}
        ganhoCapital={ganhoCapital}
        dividendos={dividendos}
        proventos12M={proventos12M}
        proventosTotal={proventosTotal}
        variacaoPercent={variacaoPercent}
        variacaoValor={variacaoValor}
        rentabilidadePercent={rentabilidadePercent}
      />

      {/* Performance Comparison Chart (Full Width) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <PerformanceComparisonChart />
      </div>

      {/* Evolution and Pie Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <EvolutionChart />
        <PortfolioPieChart positions={positions} />
      </div>

    </div>
  );
}
