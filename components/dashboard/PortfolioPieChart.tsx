"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { PortfolioPosition } from "@/lib/portfolio";
import { classifyAsset } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PortfolioPieChartProps {
  positions: PortfolioPosition[];
}

const COLORS_ATIVO = [
  "#6366f1", // indigo-500
  "#10b981", // emerald-500
  "#8b5cf6", // violet-500
  "#f59e0b", // amber-500
  "#ec4899", // pink-500
  "#3b82f6", // blue-500
  "#14b8a6", // teal-500
  "#f97316", // orange-500
  "#a855f7", // purple-500
  "#ef4444", // red-500
];

const COLORS_CLASSE = {
  "Ações": "#fcd34d", // amber-300
  "FIIs": "#38bdf8", // sky-400
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-neutral-800 border border-neutral-700 p-3 rounded-md shadow-md text-sm">
        <p className="font-semibold text-neutral-200 mb-1">{data.name}</p>
        <p className="text-emerald-400">
          R$ {data.value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p className="text-neutral-400 text-xs mt-1">
          {data.percent ? `${(data.percent * 100).toFixed(2)}%` : ''}
        </p>
      </div>
    );
  }
  return null;
};

export function PortfolioPieChart({ positions }: PortfolioPieChartProps) {
  const [tipoAtivo, setTipoAtivo] = useState("todos");

  if (!positions || positions.length === 0) {
    return (
      <Card className="col-span-1 border-neutral-800 bg-neutral-900 text-neutral-100 flex flex-col items-center justify-center min-h-[400px]">
        <CardHeader className="text-center">
          <CardTitle>Ativos na Carteira</CardTitle>
          <div className="text-neutral-400 text-sm">
            Carteira Vazia - Adicione Lançamentos
          </div>
        </CardHeader>
      </Card>
    );
  }

  // Filter based on dropdown
  const filteredPositions = positions.filter(pos => {
    if (tipoAtivo === "todos") return true;
    if (tipoAtivo === "acoes") return classifyAsset(pos.ticker) === "Ações";
    if (tipoAtivo === "fii") return classifyAsset(pos.ticker) === "FII";
    return true;
  });

  const totalBalance = filteredPositions.reduce((acc, pos) => acc + pos.balance, 0);

  // Use classes format if "Todos os tipos" is selected, else show by Ticker
  let currentData = [];

  if (tipoAtivo === "todos") {
    const classesMap = filteredPositions.reduce((acc, pos) => {
      // Use plural form to match requested colors/design
      const classe = classifyAsset(pos.ticker) === "FII" ? "FIIs" : "Ações";
      acc[classe] = (acc[classe] || 0) + pos.balance;
      return acc;
    }, {} as Record<string, number>);

    currentData = Object.keys(classesMap).map((key) => ({
      name: key,
      value: classesMap[key],
      percent: totalBalance > 0 ? classesMap[key] / totalBalance : 0
    }));
  } else {
    currentData = filteredPositions.map((pos) => ({
      name: pos.ticker,
      value: pos.balance,
      percent: totalBalance > 0 ? pos.balance / totalBalance : 0
    }));
  }

  return (
    <Card className="col-span-1 border-neutral-800 bg-neutral-900 text-neutral-100 h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl">Ativos na Carteira</CardTitle>
        <select
          value={tipoAtivo}
          onChange={(e) => setTipoAtivo(e.target.value)}
          className="bg-neutral-800 border border-neutral-700 text-neutral-300 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="todos">Todos os tipos</option>
          <option value="acoes">Ações</option>
          <option value="fii">FIIs</option>
        </select>
      </CardHeader>
      <CardContent className="flex items-center justify-center pt-6">
        <div className="h-[280px] w-full flex min-w-0">
          <ResponsiveContainer width="60%" height="100%">
            <PieChart>
              <Pie
                data={currentData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={0}
                dataKey="value"
                stroke="none"
              >
                {currentData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={tipoAtivo === "todos" ? COLORS_CLASSE[entry.name as keyof typeof COLORS_CLASSE] : COLORS_ATIVO[index % COLORS_ATIVO.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="w-[40%] flex flex-col justify-center">
             {/* Custom Legend to match screenshot */}
             <ul className="flex flex-col gap-3">
              {currentData.map((entry, index) => {
                const color = tipoAtivo === "todos" ? COLORS_CLASSE[entry.name as keyof typeof COLORS_CLASSE] : COLORS_ATIVO[index % COLORS_ATIVO.length];
                return (
                  <li key={`item-${index}`} className="flex items-center justify-between text-xs text-neutral-300">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }}></span>
                      <span>{entry.name}</span>
                    </div>
                    <span className="font-mono text-neutral-400">
                      {entry.percent ? (entry.percent * 100).toFixed(2) : '0.00'}%
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
