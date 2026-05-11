"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useUser } from "@/contexts/UserContext";
import type { PriceAlert, CreatePriceAlertPayload } from "@/types/price-alert";

interface UsePriceAlertsReturn {
  alerts: PriceAlert[];
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  createAlert: (payload: CreatePriceAlertPayload) => void;
  deleteAlert: (id: string) => void;
  refetch: () => void;
  isCreating: boolean;
  isDeleting: boolean;
}

export function usePriceAlerts(): UsePriceAlertsReturn {
  const queryClient = useQueryClient();
  const user = useUser();

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["price-alerts"],
    queryFn: async () => {
      const response = await fetch("/api/price-alerts");
      if (!response.ok) {
        throw new Error("Falha ao buscar alertas de preço");
      }
      return response.json() as Promise<PriceAlert[]>;
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 segundos
  });

  const alerts = data || [];
  const isEmpty = !isLoading && !isError && alerts.length === 0;

  // Mutation para criar alerta
  const createAlertMutation = useMutation({
    mutationFn: async (payload: CreatePriceAlertPayload) => {
      const response = await fetch("/api/price-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Falha ao criar alerta");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["price-alerts"] });
    },
  });

  // Mutation para deletar alerta
  const deleteAlertMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/price-alerts/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Falha ao cancelar alerta");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["price-alerts"] });
    },
  });

  const createAlert = useCallback(
    (payload: CreatePriceAlertPayload) => createAlertMutation.mutate(payload),
    [createAlertMutation]
  );

  const deleteAlert = useCallback(
    (id: string) => deleteAlertMutation.mutate(id),
    [deleteAlertMutation]
  );

  const isCreating = createAlertMutation.isPending;
  const isDeleting = deleteAlertMutation.isPending;

  return {
    alerts,
    isLoading,
    isError,
    isEmpty,
    createAlert,
    deleteAlert,
    refetch,
    isCreating,
    isDeleting,
  };
}