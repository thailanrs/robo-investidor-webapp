"use client";

import React, { useEffect, useState } from 'react';
import { MacroOverview } from '@/types/market';

export const MacroBanner: React.FC = () => {
  const [macroData, setMacroData] = useState<MacroOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchMacro() {
      try {
        const res = await fetch('/api/macro');
        if (!res.ok) throw new Error('Macro fetch failed');
        const json = await res.json();
        setMacroData(json.data);
      } catch {
        setError(true);
      } finally {
        setIsLoading(false);
      }
    }

    fetchMacro();

    // Atualizar a cada 1 hora
    const interval = setInterval(fetchMacro, 3_600_000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="w-full bg-zinc-50 dark:bg-zinc-900 border-y border-zinc-200 dark:border-zinc-800 py-2 overflow-hidden h-[38px]">
        <div className="flex items-center h-full px-4 space-x-6 animate-pulse">
          <div className="h-3 w-28 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
          <div className="h-3 w-28 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
          <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !macroData) {
    return null;
  }

  const usd = macroData.currencies?.find(c => c.pair === 'USD/BRL');
  const eur = macroData.currencies?.find(c => c.pair === 'EUR/BRL');
  const selic = macroData.rates?.find(r => r.name === 'SELIC');

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const formatPercent = (val: number) => `${val >= 0 ? '+' : ''}${val.toFixed(2)}%`;
  
  const getChangeColor = (val: number) => val >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';

  return (
    <div className="w-full bg-zinc-50 dark:bg-zinc-900 border-y border-zinc-200 dark:border-zinc-800 py-2 px-4 flex items-center justify-between text-[13px] h-[38px] overflow-x-auto no-scrollbar">
      <div className="flex items-center space-x-8 min-w-max">
        {usd && (
          <div className="flex items-center space-x-2">
            <span className="font-bold text-zinc-600 dark:text-zinc-400 tracking-wide">USD</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{formatCurrency(usd.bidPrice)}</span>
            <span className={`font-semibold ${getChangeColor(usd.percentChange)}`}>
              {formatPercent(usd.percentChange)}
            </span>
          </div>
        )}
        
        {eur && (
          <div className="flex items-center space-x-2">
            <span className="font-bold text-zinc-600 dark:text-zinc-400 tracking-wide">EUR</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{formatCurrency(eur.bidPrice)}</span>
            <span className={`font-semibold ${getChangeColor(eur.percentChange)}`}>
              {formatPercent(eur.percentChange)}
            </span>
          </div>
        )}

        {selic && (
          <div className="flex items-center space-x-2">
            <span className="font-bold text-zinc-600 dark:text-zinc-400 tracking-wide">SELIC</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{selic.value}% {selic.unit}</span>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2 ml-8 text-[11px] font-medium text-zinc-500 uppercase tracking-wider min-w-max">
        {!macroData.stale && (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
        )}
        <span>Ao vivo</span>
      </div>
    </div>
  );
};
