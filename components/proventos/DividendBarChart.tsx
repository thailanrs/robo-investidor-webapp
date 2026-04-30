"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { Dividend } from "@/lib/dividends";

interface DividendBarChartProps {
  data: Dividend[];
  period: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0
  }).format(value);
};

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number, color: string, dataKey: string, payload: any }>; label?: string }) => {
  if (active && payload && payload.length) {
    const entryData = payload[0].payload;
    const displayLabel = entryData.fullRange || label;
    const total = payload.reduce((sum: number, entry: { value: number }) => sum + entry.value, 0);

    return (
      <div className="bg-zinc-900/90 backdrop-blur-sm border border-white/10 rounded-xl p-3 shadow-xl">
        <p className="text-zinc-300 font-medium mb-2 text-sm">{displayLabel}</p>
        <div className="space-y-1.5 mb-2 border-b border-white/5 pb-2">
          {payload.map((entry: { value: number, color: string, dataKey: string }, index: number) => {
            if (entry.value === 0) return null;
            return (
              <div key={index} className="flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-zinc-400 capitalize">{entry.dataKey.replace('_', ' ').toLowerCase()}</span>
                </div>
                <span className="font-semibold text-zinc-100 tabular-nums">{formatCurrency(entry.value)}</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-between text-xs pt-1">
          <span className="text-zinc-400">Total</span>
          <span className="font-bold text-emerald-400 tabular-nums">{formatCurrency(total)}</span>
        </div>
      </div>
    );
  }
  return null;
};

export function DividendBarChart({ data, period }: DividendBarChartProps) {
  // 1. Calcular total de meses e tamanho do grupo para ter exatamente 12 barras
  let totalMonths = 12;
  if (period === "1y") totalMonths = 12;
  else if (period === "2y") totalMonths = 24;
  else if (period === "5y") totalMonths = 60;
  else if (period === "max") {
    if (data.length > 0) {
      const dates = data.map(d => new Date(d.payment_date));
      const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
      const now = new Date();
      totalMonths = (now.getFullYear() - minDate.getFullYear()) * 12 + (now.getMonth() - minDate.getMonth()) + 1;
      totalMonths = Math.max(totalMonths, 12);
    }
  }

  const groupSize = Math.max(1, Math.ceil(totalMonths / 12));
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const now = new Date();
  
  const chartData = [];

  // 2. Gerar 12 grupos
  for (let i = 11; i >= 0; i--) {
    const bucketEnd = new Date(now.getFullYear(), now.getMonth() - (i * groupSize), 1);
    const bucketStart = new Date(bucketEnd.getFullYear(), bucketEnd.getMonth() - (groupSize - 1), 1);
    
    const displayMonth = `${months[bucketEnd.getMonth()]}/${bucketEnd.getFullYear()}`;
    const startMonth = `${months[bucketStart.getMonth()]}/${bucketStart.getFullYear()}`;
    const fullRange = groupSize > 1 ? `${startMonth} - ${displayMonth}` : displayMonth;
    
    const entry = {
      month: displayMonth,
      fullRange: fullRange,
      DIVIDENDO: 0,
      JCP: 0,
      RENDIMENTO_FII: 0,
      AMORTIZACAO: 0,
      total: 0
    };

    // 3. Somar proventos dentro do intervalo do grupo
    data.forEach((d) => {
      const date = new Date(d.payment_date + 'T00:00:00');
      const normalizedDate = new Date(date.getFullYear(), date.getMonth(), 1);
      
      if (normalizedDate >= bucketStart && normalizedDate <= bucketEnd) {
        entry[d.type] += Number(d.amount);
        entry.total += Number(d.amount);
      }
    });

    chartData.push(entry);
  }





  return (
    <div className="w-full h-full min-h-[300px]" style={{ position: 'relative' }}>
      <ResponsiveContainer width="100%" height="100%" id="dividend-chart-container">
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#71717a', fontSize: 12, fontFamily: 'var(--font-geist-mono)' }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#71717a', fontSize: 12, fontFamily: 'var(--font-geist-mono)' }}
            tickFormatter={(value) => `R$ ${value}`}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
            iconType="circle"
          />
          <Bar dataKey="DIVIDENDO" name="Dividendo" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
          <Bar dataKey="RENDIMENTO_FII" name="Rendimento FII" stackId="a" fill="#22d3ee" radius={[0, 0, 0, 0]} />
          <Bar dataKey="JCP" name="JCP" stackId="a" fill="#fbbf24" radius={[0, 0, 0, 0]} />
          <Bar dataKey="AMORTIZACAO" name="Amortização" stackId="a" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
