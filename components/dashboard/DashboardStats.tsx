"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Coins, Wallet, PiggyBank, TrendingUp } from "lucide-react";

interface DashboardStatsProps {
  patrimonioTotal: number;
  valorInvestido: number;
  lucroTotal: number;
  ganhoCapital: number;
  dividendos: number;
  proventos12M: number;
  proventosTotal: number;
  variacaoPercent: number;
  variacaoValor: number;
  rentabilidadePercent: number;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatPercent = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "percent", minimumFractionDigits: 2 }).format(value / 100);

export function DashboardStats({
  patrimonioTotal,
  valorInvestido,
  lucroTotal,
  ganhoCapital,
  dividendos,
  proventos12M,
  proventosTotal,
  variacaoPercent,
  variacaoValor,
  rentabilidadePercent
}: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Patrimônio Total */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-neutral-400 mb-2">
            <PiggyBank className="w-5 h-5" />
            <span className="font-medium text-sm">Patrimônio total</span>
          </div>
          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-2xl font-bold text-neutral-100">{formatCurrency(patrimonioTotal)}</span>
            <span className={`flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${variacaoPercent >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
              {formatPercent(variacaoPercent)}
              {variacaoPercent >= 0 ? <ArrowUpRight className="w-3 h-3 ml-1" /> : <ArrowDownRight className="w-3 h-3 ml-1" />}
            </span>
          </div>
          <div className="text-sm text-neutral-500">
            <div>Valor investido</div>
            <div className="font-medium text-neutral-400">{formatCurrency(valorInvestido)}</div>
          </div>
        </CardContent>
      </Card>

      {/* Lucro Total */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-neutral-400 mb-2">
            <Coins className="w-5 h-5" />
            <span className="font-medium text-sm">Lucro total</span>
          </div>
          <div className="mb-4">
            <span className="text-2xl font-bold text-emerald-400">{formatCurrency(lucroTotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-neutral-500">
            <div>
              <div>Ganho de Capital</div>
              <div className="font-medium text-neutral-400">{formatCurrency(ganhoCapital)}</div>
            </div>
            <div>
              <div>Dividendos Recebidos</div>
              <div className="font-medium text-neutral-400">{formatCurrency(dividendos)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Proventos */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-neutral-400 mb-2">
            <Wallet className="w-5 h-5" />
            <span className="font-medium text-sm">Proventos Recebidos (12M)</span>
          </div>
          <div className="mb-4">
            <span className="text-2xl font-bold text-neutral-100">{formatCurrency(proventos12M)}</span>
          </div>
          <div className="text-sm text-neutral-500">
            <div>Total</div>
            <div className="font-medium text-neutral-400">{formatCurrency(proventosTotal)}</div>
          </div>
        </CardContent>
      </Card>

      {/* Rentabilidade */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 text-neutral-400 mb-2">
                <TrendingUp className="w-5 h-5" />
                <span className="font-medium text-sm">Variação</span>
              </div>
              <div className="mb-1">
                <span className={`text-xl font-bold flex items-center ${variacaoPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatPercent(variacaoPercent)}
                  {variacaoPercent >= 0 ? <ArrowUpRight className="w-4 h-4 ml-1" /> : <ArrowDownRight className="w-4 h-4 ml-1" />}
                </span>
              </div>
              <div className="text-sm font-medium text-neutral-400">
                {formatCurrency(variacaoValor)}
              </div>
            </div>
            <div>
              <div className="text-neutral-400 mb-2">
                <span className="font-medium text-sm">Rentabilidade</span>
              </div>
              <div className="mb-1">
                <span className={`text-xl font-bold flex items-center ${rentabilidadePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatPercent(rentabilidadePercent)}
                  {rentabilidadePercent >= 0 ? <ArrowUpRight className="w-4 h-4 ml-1" /> : <ArrowDownRight className="w-4 h-4 ml-1" />}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
