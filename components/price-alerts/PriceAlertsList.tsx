"use client";

import { usePriceAlerts } from "@/hooks/usePriceAlerts";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatters";

export function PriceAlertsList() {
  const { alerts, isLoading, isError, isEmpty, deleteAlert, isDeleting } =
    usePriceAlerts();

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center gap-2 text-red-400 p-4 bg-red-950/20 rounded-lg">
        <AlertTriangle className="h-4 w-4" />
        <span>Erro ao carregar alertas. Tente novamente.</span>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="text-center p-6 text-muted-foreground">
        <p>Você ainda não tem alertas de preço ativos.</p>
        <p className="text-sm mt-1">
          Crie um alerta na página de detalhes do ativo.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-foreground">
        Seus Alertas Ativos
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
                  {alert.direction === "above" ? "↑ Acima" : "↓ Abaixo"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Alvo: {formatCurrency(alert.target_price)}
              </p>
            </div>
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
          </div>
        ))}
      </div>
    </div>
  );
}