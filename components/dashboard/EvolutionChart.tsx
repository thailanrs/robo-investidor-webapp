"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const entryData = payload[0].payload;
    const displayLabel = entryData.fullRange || label;
    const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);
    return (
      <div className="bg-zinc-900/90 backdrop-blur-sm border border-white/10 p-3 rounded-xl shadow-xl text-sm">
        <p className="font-semibold text-zinc-100 mb-2">{displayLabel}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 mb-1.5 last:mb-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-zinc-400">{entry.name}</span>
            </div>
            <span className="font-bold text-zinc-100 tabular-nums">{formatCurrency(entry.value)}</span>
          </div>
        ))}
        <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
          <span className="text-zinc-400 font-medium">Patrimônio Total</span>
          <span className="font-bold text-emerald-400 tabular-nums">{formatCurrency(total)}</span>
        </div>
      </div>
    );
  }
  return null;
};

export function EvolutionChart() {
  const [periodo, setPeriodo] = useState("1y");

  const { data: equityResponse, isLoading } = useQuery({
    queryKey: ["portfolio-equity"],
    queryFn: async () => {
      const res = await fetch("/api/portfolio/equity");
      return res.json();
    },
  });

  const fullData = equityResponse?.data || [];

  // Implementação da lógica de 12 barras fixas
  const getGroupedData = () => {
    if (fullData.length === 0) return [];
    
    let totalMonths = 12;
    if (periodo === "1y") totalMonths = 12;
    else if (periodo === "2y") totalMonths = 24;
    else if (periodo === "5y") totalMonths = 60;
    else if (periodo === "max") {
      totalMonths = fullData.length;
    }

    // Filtrar os últimos N meses
    const dataSlice = fullData.slice(-totalMonths);
    const groupSize = Math.max(1, Math.ceil(dataSlice.length / 12));
    const grouped = [];

    const monthsLong = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

    for (let i = 0; i < 12; i++) {
      const startIndex = i * groupSize;
      const endIndex = Math.min(startIndex + groupSize - 1, dataSlice.length - 1);
      
      if (startIndex >= dataSlice.length) break;

      const lastPoint = dataSlice[endIndex];
      const firstPoint = dataSlice[startIndex];

      // Formatar rótulos
      const [mEnd, yEnd] = lastPoint.month.split('/');
      const labelEnd = `${monthsLong[parseInt(mEnd) - 1]}/${yEnd}`;
      
      const [mStart, yStart] = firstPoint.month.split('/');
      const labelStart = `${monthsLong[parseInt(mStart) - 1]}/${yStart}`;

      grouped.push({
        ...lastPoint,
        month: labelEnd,
        fullRange: groupSize > 1 ? `${labelStart} - ${labelEnd}` : labelEnd
      });
    }

    return grouped;
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const chartData = getGroupedData();

  if (!mounted) {
    return (
      <Card className="col-span-2 border-white/5 bg-zinc-900/50 backdrop-blur-md text-zinc-100 min-h-[440px]">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
           <div className="h-10 w-48 bg-zinc-800 animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="h-[320px] w-full mt-6 bg-zinc-800/20 animate-pulse rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-2 border-white/5 bg-zinc-900/50 backdrop-blur-md text-zinc-100">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-xl font-bold tracking-tight">Evolução do Patrimônio</CardTitle>
          <p className="text-sm text-zinc-500 mt-1">Comparativo entre capital aplicado e valorização</p>
        </div>
        <div className="flex bg-zinc-900/60 backdrop-blur-sm rounded-xl p-1 border border-white/5">
          {["1y", "2y", "5y", "max"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-300 ${
                periodo === p
                  ? "bg-zinc-800 text-white shadow-lg ring-1 ring-white/10"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
              }`}
            >
              {p === "1y" ? "1A" : p === "2y" ? "2A" : p === "5y" ? "5A" : "Máx"}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[320px] w-full mt-6 min-w-0 min-h-0" style={{ position: 'relative' }}>
          {isLoading ? (
            <div className="h-full w-full flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%" debounce={50} minWidth={0} minHeight={0} id="equity-evolution-container">
              <BarChart
                data={chartData}
                margin={{ top: 0, right: 25, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#71717a', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#71717a', fontSize: 12 }}
                  tickFormatter={(value) => `R$ ${Math.abs(value) >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                  domain={['auto', 'auto']}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Legend
                  verticalAlign="top"
                  height={48}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px', paddingBottom: '20px' }}
                />
                <Bar 
                  dataKey="valorAplicado" 
                  name="Valor Aplicado" 
                  stackId="a" 
                  fill="#10b981" 
                  radius={[0, 0, 0, 0]} 
                  opacity={0.8}
                />
                <Bar 
                  dataKey="ganhoCapital" 
                  name="Ganho de Capital" 
                  stackId="a" 
                  fill="#22d3ee" 
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
