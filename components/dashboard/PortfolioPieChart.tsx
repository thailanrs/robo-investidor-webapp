"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { PortfolioPosition } from "@/lib/portfolio";
import { classifyAsset } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
  "Ações": "#6366f1", // indigo-500
  "FII": "#10b981", // emerald-500
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-neutral-800 border border-neutral-700 p-3 rounded-md shadow-md text-sm">
        <p className="font-semibold text-neutral-200 mb-1">{payload[0].name}</p>
        <p className="text-emerald-400">
          R$ {payload[0].value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>
    );
  }
  return null;
};

export function PortfolioPieChart({ positions }: PortfolioPieChartProps) {
  const [viewMode, setViewMode] = useState<"ativo" | "classe">("ativo");

  if (!positions || positions.length === 0) {
    return (
      <Card className="col-span-1 border-neutral-800 bg-neutral-900 text-neutral-100 flex flex-col items-center justify-center min-h-[400px]">
        <CardHeader className="text-center">
          <CardTitle>Composição da Carteira</CardTitle>
          <CardDescription className="text-neutral-400">
            Carteira Vazia - Adicione Lançamentos
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Preparar dados por Ativo
  const dataPorAtivo = positions.map((pos) => ({
    name: pos.ticker,
    value: pos.balance,
  }));

  // Preparar dados por Classe
  const classesMap = positions.reduce((acc, pos) => {
    const classe = classifyAsset(pos.ticker);
    acc[classe] = (acc[classe] || 0) + pos.balance;
    return acc;
  }, {} as Record<string, number>);

  const dataPorClasse = Object.keys(classesMap).map((key) => ({
    name: key,
    value: classesMap[key],
  }));

  const currentData = viewMode === "ativo" ? dataPorAtivo : dataPorClasse;

  return (
    <Card className="col-span-1 border-neutral-800 bg-neutral-900 text-neutral-100">
      <CardHeader className="pb-2">
        <CardTitle>Composição da Carteira</CardTitle>
        <CardDescription className="text-neutral-400">
          Distribuição dos seus investimentos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="ativo" onValueChange={(val) => setViewMode(val as "ativo" | "classe")} className="w-full mb-4">
          <TabsList className="grid w-full grid-cols-2 bg-neutral-800 text-neutral-400">
            <TabsTrigger value="ativo" className="data-[state=active]:bg-neutral-700 data-[state=active]:text-neutral-100">
              Por Ativo
            </TabsTrigger>
            <TabsTrigger value="classe" className="data-[state=active]:bg-neutral-700 data-[state=active]:text-neutral-100">
              Por Classe
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={currentData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {currentData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={viewMode === "ativo" ? COLORS_ATIVO[index % COLORS_ATIVO.length] : COLORS_CLASSE[entry.name as keyof typeof COLORS_CLASSE]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
