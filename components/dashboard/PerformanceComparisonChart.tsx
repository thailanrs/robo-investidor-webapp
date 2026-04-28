"use client";

import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900/90 backdrop-blur-sm border border-white/10 p-4 rounded-xl shadow-2xl">
        <p className="font-semibold text-zinc-200 mb-3 text-sm">{label}</p>
        <div className="flex flex-col gap-2">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color, boxShadow: `0 0 10px ${entry.color}` }}></span>
                <span className="text-xs text-zinc-300">{entry.name}</span>
              </div>
              <span className="font-mono text-sm font-semibold text-white">
                {entry.value.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderLegend = (props: any) => {
  const { payload } = props;
  return (
    <div className="flex justify-center gap-6 mt-4">
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((entry: any, index: number) => (
        <div key={`item-${index}`} className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color, boxShadow: `0 0 8px ${entry.color}80` }}
          ></span>
          <span className="text-xs font-medium text-zinc-400">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};


export function PerformanceComparisonChart() {
  const [period, setPeriod] = useState("1y");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/portfolio/performance?period=${period}`);
        const json = await res.json();

        if (json.series && json.series.length > 0) {
          // Transform data from series to recharts format
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const formattedData: any[] = [];

          // Assuming all series have same dates
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const dates = json.series[0].data.map((d: any) => d.date);

          dates.forEach((date: string, index: number) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const entry: any = { date };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            json.series.forEach((s: any) => {
              entry[s.name] = s.data[index]?.value || 0;
            });
            formattedData.push(entry);
          });

          setData(formattedData);
        } else {
           setData([]);
        }
      } catch (error) {
        console.error("Failed to fetch performance data", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [period]);

  return (
    <Card className="col-span-1 lg:col-span-3 border-zinc-800 bg-zinc-950 text-zinc-100 overflow-hidden relative">
      {/* Subtle background glow */}
      <div className="absolute top-0 left-1/4 w-1/2 h-full bg-emerald-500/5 blur-[120px] pointer-events-none" />

      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 relative z-10">
        <CardTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
          Performance Comparativa
        </CardTitle>

        {/* Tab Pills glassmorphism */}
        <div className="flex gap-1 p-1 bg-zinc-900/50 backdrop-blur-md rounded-full border border-zinc-800 mt-4 sm:mt-0">
          {["1y", "2y", "5y", "max"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all duration-300 ${
                period === p
                  ? "bg-zinc-800 text-white shadow-lg ring-1 ring-white/10"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
              }`}
            >
              {p === "1y" ? "1A" : p === "2y" ? "2A" : p === "5y" ? "5A" : "Máx"}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="relative z-10">
        {loading ? (
           <div className="h-[350px] w-full flex flex-col gap-4 animate-pulse pt-8">
              <div className="w-full h-1/4 bg-zinc-900/50 rounded-xl" />
              <div className="w-full h-1/3 bg-zinc-900/50 rounded-xl" />
              <div className="w-full h-1/2 bg-zinc-900/50 rounded-xl" />
           </div>
        ) : data.length === 0 ? (
          <div className="h-[350px] w-full flex items-center justify-center text-zinc-500 text-sm">
            Sem dados suficientes para comparação.
          </div>
        ) : (
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorMinha" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorIdeal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCdi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#71717a', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#71717a', fontSize: 12 }}
                  domain={['auto', 'auto']}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend content={renderLegend} />

                <Area
                  type="monotone"
                  dataKey="Minha Carteira"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorMinha)"
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981', style: { filter: 'drop-shadow(0 0 8px rgba(16,185,129,0.8))' } }}
                />
                <Area
                  type="monotone"
                  dataKey="Carteira Ideal"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorIdeal)"
                />
                <Area
                  type="monotone"
                  dataKey="CDI"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fillOpacity={1}
                  fill="url(#colorCdi)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
