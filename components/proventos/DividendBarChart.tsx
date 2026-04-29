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
  monthsCount: number;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0
  }).format(value);
};

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number, color: string, dataKey: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum: number, entry: { value: number }) => sum + entry.value, 0);

    return (
      <div className="bg-zinc-900/90 backdrop-blur-sm border border-white/10 rounded-xl p-3 shadow-xl">
        <p className="text-zinc-300 font-medium mb-2 text-sm">{label}</p>
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

export function DividendBarChart({ data, monthsCount }: DividendBarChartProps) {
  // Aggregate data by month and type
  const chartDataMap = new Map<string, { month: string; DIVIDENDO: number; JCP: number; RENDIMENTO_FII: number; AMORTIZACAO: number; total: number }>();

  // Initialize last N months
  const now = new Date();
  for (let i = monthsCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const displayMonth = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });

    chartDataMap.set(monthKey, {
      month: displayMonth,
      DIVIDENDO: 0,
      JCP: 0,
      RENDIMENTO_FII: 0,
      AMORTIZACAO: 0,
      total: 0
    });
  }

  data.forEach((d) => {
    const date = new Date(d.payment_date + 'T00:00:00');
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (chartDataMap.has(monthKey)) {
      const entry = chartDataMap.get(monthKey)!;
      entry[d.type] += Number(d.amount);
      entry.total += Number(d.amount);
    }
  });

  const chartData = Array.from(chartDataMap.values());





  return (
    <div className="w-full h-full min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
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
