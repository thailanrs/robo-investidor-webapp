"use client";

import { useState, useEffect } from "react";
import { BarChart3, Rocket, Loader2, History, Sparkles, Bot } from "lucide-react";
import Link from "next/link";
import { TabelaAtivos } from "@/components/TabelaAtivos";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [resultados, setResultados] = useState<any[]>([]);
  const [dataAnalise, setDataAnalise] = useState<string | null>(null);
  
  // IA
  const [resumoIA, setResumoIA] = useState<string>("");

  // Comparador
  const [carteiraInput, setCarteiraInput] = useState<string>("");
  const [analiseCarteira, setAnaliseCarteira] = useState<string>("");
  const [loadingComparacao, setLoadingComparacao] = useState(false);

  // Carrega a análise mais recente ao iniciar
  useEffect(() => {
    const fetchLatest = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/historico/latest');
        const json = await res.json();
        if (json.success && json.data) {
          setResultados(json.data.dados_acoes || []);
          setResumoIA(json.data.resumo_ia || "");
          setDataAnalise(json.data.data_analise || json.data.created_at || null);
        }
      } catch (error) {
        console.error("Erro ao buscar última análise:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLatest();
  }, []);

  const rodarAnalise = async () => {
    setLoading(true);
    setResultados([]);
    setResumoIA("");
    
    try {
      const res = await fetch('/api/analisar');
      const json = await res.json();
      
      if (json.success) {
        setResultados(json.data);
        setDataAnalise(new Date().toISOString());
        if (json.resumo_ia) {
          setResumoIA(json.resumo_ia);
        }
      } else {
        alert("Erro na análise: " + json.error);
      }
    } catch (error) {
      alert("Erro ao conectar com a API.");
    } finally {
      setLoading(false);
    }
  };

  const compararCarteira = async () => {
    if (!carteiraInput.trim()) {
      alert("Digite os tickers da sua carteira.");
      return;
    }
    
    setLoadingComparacao(true);
    setAnaliseCarteira("");
    
    try {
      const res = await fetch('/api/comparar-carteira', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tickersUsuario: carteiraInput,
          top15: resultados
        })
      });
      const json = await res.json();
      if (json.success) {
        setAnaliseCarteira(json.analise);
      } else {
        alert("Erro na comparação: " + json.error);
      }
    } catch (e) {
      alert("Erro ao conectar com a API de comparação.");
    } finally {
      setLoadingComparacao(false);
    }
  };

  return (
    <main className="container mx-auto px-4 py-12 max-w-7xl flex flex-col items-center flex-1">
        
        {/* Top Section */}
        <div className="w-full flex flex-col items-center justify-center mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-cyan-500">
            Análise Quantitativa
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-2xl text-lg mb-8">
            Encontre as melhores ações da bolsa brasileira unindo a Fórmula Mágica de Joel Greenblatt com os filtros rigorosos de Décio Bazin e Luiz Barsi.
          </p>

          <div className="flex items-center gap-4">
            <button
              onClick={rodarAnalise}
              disabled={loading}
              className="group relative flex items-center gap-3 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 px-8 py-4 rounded-full font-semibold text-lg transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed shadow-xl hover:shadow-indigo-500/20"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Rocket className="w-6 h-6 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
              )}
              {loading ? 'Minerando dados do mercado...' : 'Rodar Análise Quantitativa'}
            </button>

            <Link
              href="/historico"
              className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-6 py-4 rounded-full font-semibold text-base transition-all active:scale-95 shadow-sm"
            >
              <History className="w-5 h-5" />
              Ver Histórico
            </Link>
          </div>

          {dataAnalise && resultados.length > 0 && (
            <div className="mt-6 inline-flex items-center px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm font-semibold border border-indigo-100 dark:border-indigo-800 animate-in fade-in zoom-in duration-500">
              Dados de: {new Date(dataAnalise).toLocaleString('pt-BR')}
            </div>
          )}
        </div>

        {/* Placeholder if empty */}
        {!loading && resultados.length === 0 && (
          <div className="w-full flex flex-col items-center justify-center min-h-[40vh] border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white/50 dark:bg-zinc-900/50 p-12 text-center">
            <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-full mb-6">
              <BarChart3 className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-zinc-700 dark:text-zinc-300">Nenhuma análise executada</h2>
            <p className="text-zinc-500 dark:text-zinc-400 max-w-sm">
              Clique no botão acima para iniciar a varredura e descobrir as melhores oportunidades de investimento.
            </p>
          </div>
        )}

        {/* AI Card (Before Table) */}
        {resultados.length > 0 && resumoIA && (
          <div className="w-full mb-8 bg-gradient-to-br from-indigo-50 to-cyan-50 dark:from-indigo-950/30 dark:to-cyan-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900 shadow-sm p-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-start gap-4">
              <div className="bg-white dark:bg-zinc-900 p-3 rounded-full shadow-sm">
                <Sparkles className="w-6 h-6 text-indigo-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">Insight de Especialista (IA)</h3>
                <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                  {resumoIA}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Results Table */}
        <TabelaAtivos resultados={resultados} />

        {/* Comparador de Carteira */}
        {resultados.length > 0 && (
          <div className="w-full mt-12 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Comparador de Carteira</h2>
            <p className="text-zinc-500 dark:text-zinc-400 mb-6">
              Digite os tickers que você possui atualmente na sua carteira para que a IA avalie se eles se alinham com o top 15 da Fórmula Mágica.
            </p>
            
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <textarea
                value={carteiraInput}
                onChange={(e) => setCarteiraInput(e.target.value)}
                placeholder="Ex: PETR4, TAEE11, WEGE3"
                className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none min-h-[100px]"
              />
              <button
                onClick={compararCarteira}
                disabled={loadingComparacao || !carteiraInput.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[220px]"
              >
                {loadingComparacao ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
                {loadingComparacao ? 'Analisando...' : 'Analisar Minha Carteira'}
              </button>
            </div>

            {analiseCarteira && (
              <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-xl p-6 animate-in fade-in zoom-in duration-500">
                <h3 className="font-semibold text-indigo-900 dark:text-indigo-300 mb-3 flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  Veredito da IA
                </h3>
                <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line text-sm md:text-base">
                  {analiseCarteira}
                </p>
              </div>
            )}
          </div>
        )}

      </main>
  );
}
