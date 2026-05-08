"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchDividends, createDividend, deleteDividend, DividendType } from "@/lib/dividends";
import { DividendForm } from "@/components/proventos/DividendForm";
import { DividendSyncModal } from "@/components/proventos/DividendSyncModal";
import { DividendBarChart } from "@/components/proventos/DividendBarChart";
import { Plus, Trash2, Coins, TrendingUp, Vault, RefreshCw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ProventosPage() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [tickerFilter, setTickerFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<DividendType | "ALL">("ALL");
  const [chartPeriod, setChartPeriod] = useState<string>("1y");

  const { data: dividendsResponse, isLoading } = useQuery({
    queryKey: ["dividends", tickerFilter, typeFilter],
    queryFn: () => fetchDividends({
      ticker: tickerFilter || undefined,
      type: typeFilter !== "ALL" ? typeFilter : undefined,
    }),
  });

  const createMutation = useMutation({
    mutationFn: createDividend,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dividends"] });
      setIsFormOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDividend,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dividends"] });
    },
  });

  const dividends = dividendsResponse?.data || [];

  // KPIs
  const last12Months = new Date();
  last12Months.setMonth(last12Months.getMonth() - 12);

  const div12M = dividends.filter(d => new Date(d.payment_date) >= last12Months);
  const total12M = div12M.reduce((sum, d) => sum + Number(d.amount), 0);
  const avgMonthly = total12M / 12;

  const monthlyTotals = new Map<string, number>();
  div12M.forEach(d => {
    const month = d.payment_date.substring(0, 7);
    monthlyTotals.set(month, (monthlyTotals.get(month) || 0) + Number(d.amount));
  });
  const bestMonthAmount = Math.max(0, ...Array.from(monthlyTotals.values()));

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const typeLabels: Record<DividendType, string> = {
    DIVIDENDO: "Dividendo",
    JCP: "JCP",
    RENDIMENTO_FII: "Rend. FII",
    AMORTIZACAO: "Amortização"
  };

  const typeColors: Record<DividendType, string> = {
    DIVIDENDO: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    JCP: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    RENDIMENTO_FII: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    AMORTIZACAO: "bg-violet-500/20 text-violet-400 border-violet-500/30"
  };

  return (
    <div className="flex-1 p-8 space-y-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-100 flex items-center gap-3">
            <Coins className="w-8 h-8 text-emerald-500" />
            Proventos
          </h1>
          <p className="text-zinc-400 mt-1">Gerencie e analise sua renda passiva.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSyncModalOpen(true)}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-white/10 px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all"
          >
            <RefreshCw className="w-5 h-5 text-emerald-400" />
            Sincronizar B3
          </button>
          <button
            onClick={() => setIsFormOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]"
          >
            <Plus className="w-5 h-5" />
            Lançar Provento
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/60 backdrop-blur-md border border-white/8 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><TrendingUp className="w-16 h-16" /></div>
          <p className="text-sm font-medium text-zinc-400 mb-1">Total Recebido (12M)</p>
          <p className="text-3xl font-bold text-zinc-100 tabular-nums">{formatCurrency(total12M)}</p>
        </div>
        <div className="bg-zinc-900/60 backdrop-blur-md border border-white/8 rounded-2xl p-5">
          <p className="text-sm font-medium text-zinc-400 mb-1">Média Mensal</p>
          <p className="text-3xl font-bold text-zinc-100 tabular-nums">{formatCurrency(avgMonthly)}</p>
        </div>
        <div className="bg-zinc-900/60 backdrop-blur-md border border-white/8 rounded-2xl p-5">
          <p className="text-sm font-medium text-zinc-400 mb-1">Maior Mês</p>
          <p className="text-3xl font-bold text-zinc-100 tabular-nums">{formatCurrency(bestMonthAmount)}</p>
        </div>
        <div className="bg-zinc-900/60 backdrop-blur-md border border-white/8 rounded-2xl p-5">
          <p className="text-sm font-medium text-zinc-400 mb-1">Yield on Cost (12M)</p>
          <p className="text-3xl font-bold text-zinc-100 tabular-nums">--%</p>
          <p className="text-xs text-zinc-500 mt-1">Requer cruzamento de carteira</p>
        </div>
      </div>

      {/* Gráfico */}
      <div className="bg-zinc-900/60 backdrop-blur-md border border-white/8 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-zinc-100">Evolução de Proventos</h2>
          <div className="flex bg-zinc-900/60 backdrop-blur-sm rounded-xl p-1 border border-white/5">
            {["1y", "2y", "5y", "max"].map((p) => (
              <button
                key={p}
                onClick={() => setChartPeriod(p)}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${chartPeriod === p ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                {p === "1y" ? "1A" : p === "2y" ? "2A" : p === "5y" ? "5A" : "Máx"}
              </button>
            ))}
          </div>
        </div>
        <div className="h-[300px]">
          <DividendBarChart data={dividends} period={chartPeriod} />
        </div>
      </div>

      {/* Filtros e Tabela */}
      <div className="bg-zinc-900/60 backdrop-blur-md border border-white/8 rounded-2xl overflow-hidden flex flex-col">
        <div className="p-5 border-b border-white/5 flex flex-col sm:flex-row gap-4 items-center justify-between bg-zinc-900/30">
          <h2 className="text-lg font-semibold text-zinc-100">Histórico de Recebimentos</h2>
          <div className="flex gap-3 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Filtrar por ticker..."
              value={tickerFilter}
              onChange={(e) => setTickerFilter(e.target.value.toUpperCase())}
              className="bg-zinc-900/60 backdrop-blur-md border border-white/8 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 w-full sm:w-40"
            />
            <div className="w-full sm:w-40">
              <Select value={typeFilter} onValueChange={(v) => { if (v !== null) setTypeFilter(v as DividendType | "ALL"); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos os Tipos</SelectItem>
                  <SelectItem value="DIVIDENDO">Dividendo</SelectItem>
                  <SelectItem value="JCP">JCP</SelectItem>
                  <SelectItem value="RENDIMENTO_FII">Rendimento FII</SelectItem>
                  <SelectItem value="AMORTIZACAO">Amortização</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 flex justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
          </div>
        ) : dividends.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mb-4">
              <Vault className="w-8 h-8 text-zinc-500" />
            </div>
            <h3 className="text-lg font-medium text-zinc-300 mb-1">Nenhum provento encontrado</h3>
            <p className="text-zinc-500 text-sm mb-6">
              {tickerFilter || typeFilter !== 'ALL'
                ? "Tente limpar os filtros para ver seus lançamentos."
                : "Você ainda não registrou nenhum recebimento de proventos."}
            </p>
            {!(tickerFilter || typeFilter !== 'ALL') && (
              <button
                onClick={() => setIsFormOpen(true)}
                className="text-emerald-400 hover:text-emerald-300 font-medium text-sm transition-colors"
              >
                Lançar Primeiro Provento
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-zinc-900/50 text-zinc-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-medium">Data</th>
                  <th className="px-6 py-4 font-medium">Ticker</th>
                  <th className="px-6 py-4 font-medium">Tipo</th>
                  <th className="px-6 py-4 font-medium text-right">Qtd.</th>
                  <th className="px-6 py-4 font-medium text-right">Valor Total</th>
                  <th className="px-6 py-4 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {dividends.map((d) => (
                  <tr key={d.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-zinc-300">
                      {new Date(d.payment_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                      {new Date(d.payment_date + 'T12:00:00') > new Date() && (
                        <span className="ml-2 text-[10px] uppercase font-bold tracking-wider bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">Futuro</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold text-zinc-100">{d.ticker}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium border ${typeColors[d.type]}`}>
                        {typeLabels[d.type]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right tabular-nums text-zinc-400">{d.quantity || '-'}</td>
                    <td className="px-6 py-4 text-right tabular-nums font-semibold text-zinc-100">
                      {formatCurrency(Number(d.amount))}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          if (confirm(`Excluir provento de ${d.ticker}?`)) {
                            deleteMutation.mutate(d.id);
                          }
                        }}
                        className="text-zinc-500 hover:text-red-400 transition-colors p-1"
                        title="Excluir provento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isFormOpen && (
        <DividendForm
          onSubmit={async (data) => { await createMutation.mutateAsync(data); }}
          onCancel={() => setIsFormOpen(false)}
        />
      )}

      {isSyncModalOpen && (
        <DividendSyncModal onClose={() => setIsSyncModalOpen(false)} />
      )}
    </div>
  );
}
