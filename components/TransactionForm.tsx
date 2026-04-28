"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { Transaction, TransactionType } from "@/lib/transactions";

const transactionSchema = z.object({
  ticker: z.string().min(4, "O ticker deve ter pelo menos 4 caracteres.").toUpperCase(),
  type: z.enum(["COMPRA", "VENDA"]),
  quantity: z.number().positive("A quantidade deve ser maior que zero."),
  unit_price: z.number().nonnegative("O preço deve ser maior ou igual a zero."),
  other_costs: z.number().nonnegative("Os custos devem ser maior ou igual a zero."),
  date: z.string().min(1, "A data é obrigatória."),
});

export type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  onSubmit: (data: TransactionFormData) => Promise<void>;
  initialData?: Transaction;
  onCancel?: () => void;
}

export function TransactionForm({ onSubmit, initialData, onCancel }: TransactionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: initialData
      ? {
          ticker: initialData.ticker,
          type: initialData.type,
          quantity: initialData.quantity,
          unit_price: initialData.unit_price,
          other_costs: initialData.other_costs || 0,
          date: initialData.date,
        }
      : {
          ticker: "",
          type: "COMPRA",
          quantity: 1,
          unit_price: 0,
          other_costs: 0,
          date: new Date().toISOString().split("T")[0],
        },
  });

  const onSubmitHandler = async (data: TransactionFormData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(data);
      if (!isEditing) reset();
    } catch (err: any) {
      setError(err.message || "Erro ao salvar transação.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmitHandler)}
      className="space-y-4 bg-zinc-100 dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800"
    >
      <div>
        <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50 mb-1">
          {isEditing ? "Editar Lançamento" : "Novo Lançamento"}
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
          {isEditing ? "Altere os dados e clique em salvar." : "Adicione uma nota de corretagem à sua carteira."}
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-100/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Ticker */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Ativo (Ticker)
          </label>
          <input
            {...register("ticker")}
            className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm uppercase"
            placeholder="Ex: PETR4"
          />
          {errors.ticker && (
            <p className="text-xs text-red-500">{errors.ticker.message}</p>
          )}
        </div>

        {/* Tipo */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Tipo da Ordem
          </label>
          <select
            {...register("type")}
            className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
          >
            <option value="COMPRA">Compra</option>
            <option value="VENDA">Venda</option>
          </select>
          {errors.type && (
            <p className="text-xs text-red-500">{errors.type.message}</p>
          )}
        </div>

        {/* Quantidade */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Quantidade
          </label>
          <input
            type="number"
            {...register("quantity", { valueAsNumber: true })}
            className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            placeholder="100"
          />
          {errors.quantity && (
            <p className="text-xs text-red-500">{errors.quantity.message}</p>
          )}
        </div>

        {/* Preço Unitário */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Preço Unitário (R$)
          </label>
          <input
            type="number"
            step="0.01"
            {...register("unit_price", { valueAsNumber: true })}
            className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            placeholder="0.00"
          />
          {errors.unit_price && (
            <p className="text-xs text-red-500">{errors.unit_price.message}</p>
          )}
        </div>

        {/* Outros Custos */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Outros Custos (R$)
          </label>
          <input
            type="number"
            step="0.01"
            {...register("other_costs", { valueAsNumber: true })}
            className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            placeholder="0.00"
          />
          <p className="text-xs text-zinc-400">Taxas, emolumentos, corretagem, etc.</p>
          {errors.other_costs && (
            <p className="text-xs text-red-500">{errors.other_costs.message}</p>
          )}
        </div>

        {/* Data */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Data do Lançamento
          </label>
          <input
            type="date"
            {...register("date")}
            className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
          />
          {errors.date && (
            <p className="text-xs text-red-500">{errors.date.message}</p>
          )}
        </div>
      </div>

      <div className="pt-2 flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Salvando...
            </>
          ) : isEditing ? (
            "Salvar Alterações"
          ) : (
            "Registrar Transação"
          )}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-sm"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
