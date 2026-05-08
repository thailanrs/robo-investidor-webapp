"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { DividendType } from "@/lib/dividends";

interface SyncSuggestion {
  ticker: string;
  type: DividendType;
  amount: number;
  quantity: number;
  payment_date: string;
  declared_date?: string;
  last_date_prior?: string;
  rate: number;
}

interface DividendSyncModalProps {
  onClose: () => void;
}

const typeLabels: Record<DividendType, string> = {
  DIVIDENDO: "Dividendo",
  JCP: "JCP",
  RENDIMENTO_FII: "Rend. FII",
  AMORTIZACAO: "Amortização"
};

const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
const formatDate = (dateString: string) => {
  if (!dateString) return "-";
  return new Date(dateString + 'T12:00:00').toLocaleDateString('pt-BR');
};

export function DividendSyncModal({ onClose }: DividendSyncModalProps) {
  const queryClient = useQueryClient();
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  const { data, isLoading, error } = useQuery<{ data: SyncSuggestion[] }>({
    queryKey: ["dividends-sync"],
    queryFn: async () => {
      const res = await fetch("/api/dividends/sync");
      if (!res.ok) throw new Error("Erro ao buscar sincronização");
      return res.json();
    },
    // Auto select all when data loads
  });

  const suggestions = data?.data || [];

  // Update selection when data arrives
  React.useEffect(() => {
    if (suggestions.length > 0 && selectedIndices.size === 0) {
      setSelectedIndices(new Set(suggestions.map((_, i) => i)));
    }
  }, [suggestions]);

  const importMutation = useMutation({
    mutationFn: async (dividendsToImport: SyncSuggestion[]) => {
      const res = await fetch("/api/dividends/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dividends: dividendsToImport }),
      });
      if (!res.ok) throw new Error("Erro ao importar");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dividends"] });
      onClose();
    },
  });

  const handleToggleSelectAll = () => {
    if (selectedIndices.size === suggestions.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(suggestions.map((_, i) => i)));
    }
  };

  const handleToggleSelect = (index: number) => {
    const newSet = new Set(selectedIndices);
    if (newSet.has(index)) newSet.delete(index);
    else newSet.add(index);
    setSelectedIndices(newSet);
  };

  const handleImport = () => {
    const toImport = suggestions.filter((_, i) => selectedIndices.has(i));
    if (toImport.length > 0) {
      importMutation.mutate(toImport);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-950 border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
              <RefreshCw className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-100">Sincronização B3</h2>
              <p className="text-sm text-zinc-400">Encontramos proventos não lançados com base nas suas operações.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white transition-colors bg-zinc-900 hover:bg-zinc-800 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full" />
              <p className="text-zinc-400">Consultando operações e dados de mercado...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mb-2" />
              <p className="text-zinc-100 font-medium">Erro ao sincronizar</p>
              <p className="text-zinc-400 text-sm">Tente novamente mais tarde.</p>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-2" />
              <p className="text-zinc-100 font-medium">Tudo em dia!</p>
              <p className="text-zinc-400 text-sm">Não há proventos novos para importar baseados nos seus lançamentos.</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-white/5 rounded-xl bg-zinc-900/30">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-zinc-900/80 text-zinc-400 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 text-center w-12">
                      <input 
                        type="checkbox" 
                        checked={selectedIndices.size === suggestions.length && suggestions.length > 0}
                        onChange={handleToggleSelectAll}
                        className="rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-emerald-500/50"
                      />
                    </th>
                    <th className="px-4 py-3 font-medium">Ticker</th>
                    <th className="px-4 py-3 font-medium">Tipo</th>
                    <th className="px-4 py-3 font-medium">Data Com</th>
                    <th className="px-4 py-3 font-medium">Data Pag.</th>
                    <th className="px-4 py-3 font-medium text-right">Qtd. Cotas</th>
                    <th className="px-4 py-3 font-medium text-right">Valor por Cota</th>
                    <th className="px-4 py-3 font-medium text-right">Valor Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {suggestions.map((s, i) => (
                    <tr 
                      key={i} 
                      className={`transition-colors cursor-pointer ${selectedIndices.has(i) ? 'bg-emerald-500/5 hover:bg-emerald-500/10' : 'hover:bg-white/[0.02]'}`}
                      onClick={() => handleToggleSelect(i)}
                    >
                      <td className="px-4 py-4 text-center">
                        <input 
                          type="checkbox" 
                          checked={selectedIndices.has(i)}
                          onChange={() => {}} // Handled by tr onClick
                          className="rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-emerald-500/50 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-4 font-bold text-zinc-100">{s.ticker}</td>
                      <td className="px-4 py-4">
                        <span className="text-zinc-300 bg-zinc-800 px-2 py-1 rounded text-xs">
                          {typeLabels[s.type]}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-zinc-400">{formatDate(s.last_date_prior || "")}</td>
                      <td className="px-4 py-4 text-zinc-300 font-medium">
                        {formatDate(s.payment_date)}
                        {new Date(s.payment_date + 'T12:00:00') > new Date() && (
                          <span className="ml-2 text-[10px] uppercase font-bold tracking-wider bg-amber-500/20 text-amber-500 border border-amber-500/30 px-1 rounded">Futuro</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right text-zinc-400 tabular-nums">{s.quantity}</td>
                      <td className="px-4 py-4 text-right text-zinc-400 tabular-nums">{formatCurrency(s.rate)}</td>
                      <td className="px-4 py-4 text-right font-bold text-emerald-400 tabular-nums bg-emerald-500/5">
                        {formatCurrency(s.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-zinc-900/50 flex justify-between items-center">
          <div className="text-sm text-zinc-400">
            {suggestions.length > 0 && (
              <span>
                <strong className="text-zinc-100">{selectedIndices.size}</strong> selecionados de {suggestions.length}
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={importMutation.isPending}
              className="px-5 py-2.5 rounded-xl font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleImport}
              disabled={selectedIndices.size === 0 || importMutation.isPending}
              className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-emerald-950 px-6 py-2.5 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]"
            >
              {importMutation.isPending ? "Importando..." : "Importar Selecionados"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
