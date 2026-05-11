"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { PriceAlertModal } from "@/components/price-alerts/PriceAlertModal";
import { PriceAlertsList } from "@/components/price-alerts/PriceAlertsList";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { classifyAsset } from "@/lib/utils";

interface TickerPageProps {
  params: { ticker: string };
}

async function fetchTickerData(ticker: string) {
  const response = await fetch(`/api/quote?ticker=${ticker}`);
  if (!response.ok) throw new Error("Falha ao carregar dados do ativo");
  return response.json();
}

export default function TickerDetailPage({ params }: TickerPageProps) {
  const ticker = params.ticker.toUpperCase();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["ticker", ticker],
    queryFn: () => fetchTickerData(ticker),
    staleTime: 60 * 1000, // 1 minuto
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-32" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 flex items-center gap-2 text-red-400">
        <AlertTriangle className="h-4 w-4" />
        <span>Erro ao carregar dados de {ticker}. Tente novamente.</span>
      </div>
    );
  }

  const currentPrice = data?.regularMarketPrice || 0;
  const changePercent = data?.regularMarketChangePercent || 0;
  const dayHigh = data?.regularMarketDayHigh || 0;
  const dayLow = data?.regularMarketDayLow || 0;
  const volume = data?.volume || 0;
  const assetType = classifyAsset(ticker);

  return (
    <div className="p-6 space-y-8">
      {/* Header com preço e alerta */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{ticker}</h1>
          <p className="text-muted-foreground">
            {data?.longName || ticker} — {assetType}
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold font-mono text-foreground">
            {formatCurrency(currentPrice)}
          </div>
          <p
            className={`text-sm font-medium ${
              changePercent >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {changePercent >= 0 ? "+" : ""}
            {changePercent.toFixed(2)}%
          </p>
          <PriceAlertModal
            ticker={ticker}
            children={
              <Button className="mt-2 bg-green-400 text-black hover:bg-green-500">
                Criar Alerta
              </Button>
            }
          />
        </div>
      </div>

      {/* Cards de informações */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#1a1a2e] p-4 rounded-lg border border-border">
          <h2 className="text-lg font-semibold mb-4">Informações do Ativo</h2>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Preço Atual</dt>
              <dd className="font-mono font-medium">
                {formatCurrency(currentPrice)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Variação (dia)</dt>
              <dd
                className={`font-mono font-medium ${
                  changePercent >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {changePercent >= 0 ? "+" : ""}
                {changePercent.toFixed(2)}%
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Máxima do Dia</dt>
              <dd className="font-mono font-medium">
                {formatCurrency(dayHigh)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Mínima do Dia</dt>
              <dd className="font-mono font-medium">
                {formatCurrency(dayLow)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Volume</dt>
              <dd className="font-mono font-medium">
                {new Intl.NumberFormat("pt-BR").format(volume)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Tipo</dt>
              <dd className="font-medium">{assetType}</dd>
            </div>
          </dl>
        </div>

        {/* Alertas ativos */}
        <div className="bg-[#1a1a2e] p-4 rounded-lg border border-border">
          <h2 className="text-lg font-semibold mb-4">Alertas de Preço</h2>
          <PriceAlertsList />
        </div>
      </div>
    </div>
  );
}