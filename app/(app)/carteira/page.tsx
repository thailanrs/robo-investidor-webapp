"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Briefcase, DollarSign, TrendingUp } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { fetchTransactions } from "@/lib/transactions";
import { calculatePortfolio, PortfolioPosition } from "@/lib/portfolio";
import { PortfolioTable, QuoteData } from "@/components/PortfolioTable";
import { Skeleton } from "@/components/ui/skeleton";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export default function CarteiraPage() {
  const user = useUser();
  const [positions, setPositions] = useState<PortfolioPosition[]>([]);
  const [quotes, setQuotes] = useState<Record<string, QuoteData>>({});
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(true);
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPortfolio() {
      try {
        const transactions = await fetchTransactions(user.id);
        const portfolio = calculatePortfolio(transactions);
        setPositions(portfolio);
        
        // Se a carteira tem ativos, busca cotações
        if (portfolio.length > 0) {
          fetchQuotes(portfolio);
        }
      } catch (err: any) {
        console.error("Erro ao carregar carteira:", err);
        setError("Erro ao carregar carteira: " + err.message);
      } finally {
        setIsLoadingPortfolio(false);
      }
    }

    async function fetchQuotes(currentPositions: PortfolioPosition[]) {
      setIsLoadingQuotes(true);
      try {
        const tickers = currentPositions.map(p => p.ticker).join(",");
        const res = await fetch(`/api/portfolio/quotes?tickers=${tickers}`);
        
        if (!res.ok) {
          throw new Error("Falha ao buscar cotações");
        }
        
        const data = await res.json();
        setQuotes(data);
      } catch (err) {
        console.error("Erro ao buscar cotações:", err);
        // Em caso de erro com a API (ex: timeout), não vamos quebrar a tela inteira,
        // apenas exibir os valores pelo custo (tratado dentro da tabela e nos cards).
      } finally {
        setIsLoadingQuotes(false);
      }
    }

    loadPortfolio();
  }, [user.id]);

  if (isLoadingPortfolio) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const totalAtivos = positions.length;
  const totalInvestido = positions.reduce((sum, p) => sum + p.balance, 0);
  
  // Patrimônio Atual usando cotação (ou custo se ainda não carregou a cotação)
  const patrimonioAtual = positions.reduce((sum, p) => {
    const currentPrice = quotes[p.ticker]?.price || p.avgPrice;
    return sum + (p.quantity * currentPrice);
  }, 0);

  const lucroTotal = patrimonioAtual - totalInvestido;

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-8 mt-4">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Meus Ativos
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          Posição consolidada da sua carteira com base nos lançamentos e cotação em tempo real.
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

        {/* Patrimônio Atual */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 flex items-start gap-4">
          <div className="p-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-500/10">
            <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Patrimônio Atual</p>
            {isLoadingQuotes ? (
              <Skeleton className="h-8 w-32 mt-0.5" />
            ) : (
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-0.5">
                {formatCurrency(patrimonioAtual)}
              </p>
            )}
            <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
              Investido: {formatCurrency(totalInvestido)}
            </p>
          </div>
        </div>

        {/* Lucro Total */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 flex items-start gap-4">
          <div className={`p-2.5 rounded-lg ${
            isLoadingQuotes ? "bg-zinc-100 dark:bg-zinc-800" :
            lucroTotal > 0 ? "bg-emerald-100 dark:bg-emerald-500/10" : 
            lucroTotal < 0 ? "bg-red-100 dark:bg-red-500/10" : 
            "bg-zinc-100 dark:bg-zinc-800"
          }`}>
            <TrendingUp className={`w-5 h-5 ${
              isLoadingQuotes ? "text-zinc-400" :
              lucroTotal > 0 ? "text-emerald-600 dark:text-emerald-400" : 
              lucroTotal < 0 ? "text-red-600 dark:text-red-400" : 
              "text-zinc-500"
            }`} />
          </div>
          <div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Lucro Total</p>
            {isLoadingQuotes ? (
              <Skeleton className="h-8 w-32 mt-0.5" />
            ) : (
              <p className={`text-2xl font-bold mt-0.5 ${
                lucroTotal > 0 ? "text-emerald-600 dark:text-emerald-500" : 
                lucroTotal < 0 ? "text-red-600 dark:text-red-500" : 
                "text-zinc-900 dark:text-zinc-50"
              }`}>
                {lucroTotal > 0 ? "+" : ""}{formatCurrency(lucroTotal)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Portfolio Table */}
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          Análise de Rentabilidade
        </h2>
        <PortfolioTable 
          positions={positions} 
          quotes={quotes} 
          isLoadingQuotes={isLoadingQuotes} 
        />
      </div>
    </div>
  );
}
