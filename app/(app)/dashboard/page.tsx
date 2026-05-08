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
  const [macroData, setMacroData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [portfolioRes, macroRes] = await Promise.all([
          fetch("/api/portfolio/summary"),
          fetch("/api/macro")
        ]);

        if (!portfolioRes.ok) throw new Error("Falha ao carregar resumo da carteira");
        
        const data = await portfolioRes.json();
        setStats(data);
        setPositions(data.positions || []);

        if (macroRes.ok) {
          const macroJson = await macroRes.json();
          setMacroData(macroJson);
        }
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Dashboard
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Visão geral do seu patrimônio e evolução.
          </p>
        </div>

        {macroData?.rates && macroData.rates.length > 0 && (
          <div className="flex items-center gap-4 bg-white dark:bg-zinc-900/50 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm">
            {macroData.rates.map((rate: any) => (
              <div key={rate.name} className="flex flex-col">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{rate.name}</span>
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  {rate.value}{rate.unit}
                </span>
              </div>
            ))}
          </div>
        )}
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
