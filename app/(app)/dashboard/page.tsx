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
  const [stats, setStats] = useState<any>(null);
  const [positions, setPositions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const response = await fetch("/api/portfolio/summary");
        if (!response.ok) throw new Error("Falha ao carregar resumo da carteira");
        const data = await response.json();
        setStats(data);
        setPositions(data.positions || []);
      } catch (err: any) {
        console.error("Erro ao carregar dashboard:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, [user.id]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!stats) return null;

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
        patrimonioTotal={stats.patrimonioTotal}
        valorInvestido={stats.valorInvestido}
        lucroTotal={stats.lucroTotal}
        ganhoCapital={stats.ganhoCapital}
        dividendos={stats.dividendos}
        proventos12M={stats.proventos12M}
        proventosTotal={stats.proventosTotal}
        variacaoPercent={stats.variacaoPercent}
        variacaoValor={stats.variacaoValor}
        rentabilidadePercent={stats.rentabilidadePercent}
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
