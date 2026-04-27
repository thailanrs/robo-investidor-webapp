"use client";

import { useState, useEffect } from "react";
import { History, Loader2, Calendar, Sparkles, X, ChevronRight } from "lucide-react";
import { TabelaAtivos } from "@/components/TabelaAtivos";

export default function HistoricoPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/historico');
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (e) {
        console.error("Erro ao buscar histórico:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <main className="container mx-auto px-4 py-12 max-w-7xl flex flex-col flex-1">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-xl text-indigo-600 dark:text-indigo-400">
          <History className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Histórico de Meses
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Relembre as carteiras geradas pelo algoritmo quantitativo no passado.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center flex-1 py-20 text-zinc-500">
          <Loader2 className="w-10 h-10 animate-spin mb-4 text-indigo-500" />
          <p>Buscando registros temporais...</p>
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 py-20 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white/50 dark:bg-zinc-900/50">
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-full mb-6">
            <History className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
          </div>
          <h2 className="text-xl font-semibold mb-2 text-zinc-700 dark:text-zinc-300">Nenhum registro encontrado</h2>
          <p className="text-zinc-500 dark:text-zinc-400">
            Você ainda não rodou nenhuma análise quantitativa.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map((item) => {
            const dateObj = new Date(item.data_analise || item.created_at);
            const dataStr = dateObj.toLocaleDateString('pt-BR');
            const top3 = (item.dados_acoes || []).slice(0, 3);
            
            return (
              <div 
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="group cursor-pointer bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-700 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all animate-in fade-in zoom-in duration-500 flex flex-col h-full relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
                
                <div className="flex items-center gap-2 mb-4 text-zinc-500 dark:text-zinc-400 text-sm font-medium">
                  <Calendar className="w-4 h-4" />
                  <span>{dataStr}</span>
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">Top 3 do Mês</h3>
                  <div className="flex flex-col gap-2">
                    {top3.map((acao: any, i: number) => (
                      <div key={acao.Ticker} className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50 p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-800">
                        <div className="flex items-center gap-3">
                          <span className="text-zinc-400 dark:text-zinc-500 font-bold text-xs">{i + 1}º</span>
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">{acao.Ticker}</span>
                        </div>
                        <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                          R$ {acao["Cotação Atual"]?.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between text-indigo-600 dark:text-indigo-400 font-medium text-sm group-hover:translate-x-1 transition-transform">
                  Ver carteira completa
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Detalhado */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-950 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
              <div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  Carteira Finalista
                </h2>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
                  Gerada em {new Date(selectedItem.data_analise || selectedItem.created_at).toLocaleString('pt-BR')}
                </p>
              </div>
              <button 
                onClick={() => setSelectedItem(null)}
                className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-6 h-6 text-zinc-500" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-zinc-50 dark:bg-zinc-950">
              
              {selectedItem.resumo_ia && (
                <div className="w-full mb-8 bg-gradient-to-br from-indigo-50 to-cyan-50 dark:from-indigo-950/30 dark:to-cyan-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900 shadow-sm p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-white dark:bg-zinc-900 p-3 rounded-full shadow-sm">
                      <Sparkles className="w-6 h-6 text-indigo-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">Insight de Especialista (IA)</h3>
                      <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                        {selectedItem.resumo_ia}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <TabelaAtivos resultados={selectedItem.dados_acoes || []} />
              
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
