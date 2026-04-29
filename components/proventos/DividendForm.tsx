"use client";

import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, X } from "lucide-react";
import { CreateDividendPayload, DividendType } from "@/lib/dividends";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const dividendSchema = z.object({
  ticker: z.string().min(3, "Ticker muito curto").max(10, "Ticker muito longo").toUpperCase(),
  type: z.enum(['DIVIDENDO', 'JCP', 'RENDIMENTO_FII', 'AMORTIZACAO']),
  amount: z.number().positive('Valor deve ser maior que zero'),
  quantity: z.number().positive('Quantidade deve ser maior que zero').optional().or(z.literal(0)),
  payment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato inválido (YYYY-MM-DD)"),
  notes: z.string().max(500, "Máximo de 500 caracteres").optional(),
});

type DividendFormData = z.infer<typeof dividendSchema>;

interface DividendFormProps {
  onSubmit: (data: CreateDividendPayload) => Promise<void>;
  onCancel: () => void;
}

const typeLabels: Record<DividendType, string> = {
  DIVIDENDO: "Dividendo",
  JCP: "JCP",
  RENDIMENTO_FII: "Rendimento FII",
  AMORTIZACAO: "Amortização"
};

export function DividendForm({ onSubmit, onCancel }: DividendFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<DividendFormData>({
    resolver: zodResolver(dividendSchema),
    defaultValues: {
      type: "DIVIDENDO",
      payment_date: new Date().toISOString().split('T')[0],
      amount: 0,
    },
  });

  const onSubmitForm = async (data: DividendFormData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const payload: CreateDividendPayload = {
        ticker: data.ticker,
        type: data.type,
        amount: data.amount,
        payment_date: data.payment_date,
        quantity: data.quantity && data.quantity > 0 ? data.quantity : undefined,
        notes: data.notes || undefined,
      };
      await onSubmit(payload);
    } catch (err: Error | unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar provento");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900/90 backdrop-blur-xl border border-white/10 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h2 className="text-xl font-bold text-zinc-100 tracking-tight">
            Lançar Provento
          </h2>
          <button
            onClick={onCancel}
            className="p-2 rounded-full hover:bg-white/5 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmitForm)} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-300">Ticker</label>
            <input
              {...register("ticker")}
              placeholder="PETR4"
              className="w-full bg-zinc-900/60 backdrop-blur-md border border-white/8 rounded-xl px-4 py-2.5 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/30 transition-all uppercase"
            />
            {errors.ticker && (
              <p className="text-red-400 text-xs">{errors.ticker.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-300">Tipo de Provento</label>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(typeLabels) as [DividendType, string][]).map(([val, label]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.type && <p className="text-red-400 text-xs">{errors.type.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-300">Valor Total (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register("amount", { valueAsNumber: true })}
                className="w-full bg-zinc-900/60 backdrop-blur-md border border-white/8 rounded-xl px-4 py-2.5 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/30 transition-all tabular-nums"
              />
              {errors.amount && (
                <p className="text-red-400 text-xs">{errors.amount.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-300">Qtd. Cotas/Ações (Opcional)</label>
              <input
                type="number"
                step="0.0001"
                min="0"
                {...register("quantity", { valueAsNumber: true })}
                className="w-full bg-zinc-900/60 backdrop-blur-md border border-white/8 rounded-xl px-4 py-2.5 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/30 transition-all tabular-nums"
              />
              {errors.quantity && (
                <p className="text-red-400 text-xs">{errors.quantity.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-300">Data de Pagamento</label>
            <input
              type="date"
              {...register("payment_date")}
              className="w-full bg-zinc-900/60 backdrop-blur-md border border-white/8 rounded-xl px-4 py-2.5 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/30 transition-all [color-scheme:dark]"
            />
            {errors.payment_date && (
              <p className="text-red-400 text-xs">{errors.payment_date.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-300">Observações (Opcional)</label>
            <textarea
              {...register("notes")}
              rows={2}
              className="w-full bg-zinc-900/60 backdrop-blur-md border border-white/8 rounded-xl px-4 py-2.5 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/30 transition-all resize-none"
            />
            {errors.notes && (
              <p className="text-red-400 text-xs">{errors.notes.message}</p>
            )}
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/5">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-emerald-950 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Salvar Provento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
