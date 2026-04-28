"use client";

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Mock data representing the last 12 months for demonstration
const mockData = [
  { month: '04/25', valorAplicado: 32000, ganhoCapital: 1500 },
  { month: '05/25', valorAplicado: 26000, ganhoCapital: 400 },
  { month: '06/25', valorAplicado: 26200, ganhoCapital: 500 },
  { month: '07/25', valorAplicado: 26500, ganhoCapital: -1000 },
  { month: '08/25', valorAplicado: 26500, ganhoCapital: 600 },
  { month: '09/25', valorAplicado: 26800, ganhoCapital: 300 },
  { month: '10/25', valorAplicado: 26800, ganhoCapital: 200 },
  { month: '11/25', valorAplicado: 26800, ganhoCapital: 500 },
  { month: '12/25', valorAplicado: 27000, ganhoCapital: 700 },
  { month: '01/26', valorAplicado: 27000, ganhoCapital: 1200 },
  { month: '02/26', valorAplicado: 27000, ganhoCapital: 1000 },
  { month: '03/26', valorAplicado: 27000, ganhoCapital: 800 },
  { month: '04/26', valorAplicado: 27000, ganhoCapital: 900 },
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-neutral-800 border border-neutral-700 p-3 rounded-md shadow-md text-sm">
        <p className="font-semibold text-neutral-200 mb-2">{label}</p>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="mb-1">
            {entry.name}: R$ {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};


export function EvolutionChart() {
  const [periodo, setPeriodo] = useState("12_meses");
  const [tipoAtivo, setTipoAtivo] = useState("todos");

  return (
    <Card className="col-span-2 border-neutral-800 bg-neutral-900 text-neutral-100">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl">Evolução do Patrimônio</CardTitle>
        <div className="flex gap-2">
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="bg-neutral-800 border border-neutral-700 text-neutral-300 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="desde_inicio">Desde o início</option>
            <option value="12_meses">12 Meses</option>
            <option value="2_anos">2 Anos</option>
            <option value="5_anos">5 Anos</option>
            <option value="10_anos">10 Anos</option>
          </select>

          <select
            value={tipoAtivo}
            onChange={(e) => setTipoAtivo(e.target.value)}
            className="bg-neutral-800 border border-neutral-700 text-neutral-300 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="todos">Todos os tipos</option>
            <option value="acoes">Ações</option>
            <option value="fii">FIIs</option>
          </select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={mockData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3f3f46" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#a1a1aa', fontSize: 12 }}
                dy={10}
                angle={-45}
                textAnchor="end"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#a1a1aa', fontSize: 12 }}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#27272a' }} />
              <Legend
                verticalAlign="top"
                height={36}
                iconType="rect"
                wrapperStyle={{ fontSize: '12px', paddingBottom: '20px' }}
              />
              <Bar dataKey="valorAplicado" name="Valor aplicado" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
              <Bar dataKey="ganhoCapital" name="Ganho de Capital" stackId="a" fill="#6ee7b7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
