"use client";

import { usePriceAlerts } from "@/hooks/usePriceAlerts";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2, Loader2, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatters";
import Link from "next/link";

export default function AlertsPage() {
  const { alerts, isLoading, isError, isEmpty, deleteAlert, isDeleting } =
    usePriceAlerts();

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Alertas de Preço</h1>
          <p className="text-muted-foreground">
            Gerencie seus alertas e receba notificações por e-mail quando o preço atingir o valor alvo.
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      )}

      {isError && (
        <div className="flex items-center gap-2 text-red-400 p-4 bg-red-950/20 rounded-lg">
          <AlertTriangle className="h-4 w-4" />
          <span>Erro ao carregar alertas. Tente novamente.</span>
        </div>
      )}

      {!isLoading && !isError && (
        <>
          {isEmpty ? (
            <div className="text-center p-8 bg-[#1a1a2e] border border-border rounded-lg">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">
                Nenhum alerta ativo
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Crie alertas na página de detalhes de cada ativo.
              </p>
              <Button asChild variant="outline">
                <Link href="/ativos">Ver meus ativos</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground">
                Seus Alertas Ativos
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({alerts.length})
                </span>
              </h3>
              <div className="space-y-2">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-3 bg-[#1a1a2e] border border-border rounded-lg hover:bg-muted/50 transition-colors duration-200"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium text-foreground">
                          {alert.ticker}
                        </span>
                        <span
                          className={cn(
                            "text-xs px-2 py-0.5 rounded-full",
                            alert.direction === "above"
                              ? "bg-green-900/30 text-green-400"
                              : "bg-red-900/30 text-red-400"
                          )}
                        >
                          {alert.direction === "above" ? "↑ Acima" : "↓ Abaixo"}{" "}
                          {formatCurrency(alert.target_price)}
                        </span>
                      </div>
                      {alert.triggered_at && (
                        <p className="text-xs text-muted-foreground">
                          Disparado em{" "}
                          {new Date(alert.triggered_at).toLocaleDateString(
                            "pt-BR"
                          )}
                        </p>
                      )}
                    </div>
                    {!alert.triggered_at && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteAlert(alert.id)}
                        disabled={isDeleting}
                        className="text-muted-foreground hover:text-red-400 hover:bg-red-950/20 disabled:opacity-50"
                        aria-label={`Cancelar alerta para ${alert.ticker}`}
                      >
                        {isDeleting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}