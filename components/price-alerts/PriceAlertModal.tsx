"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { usePriceAlerts } from "@/hooks/usePriceAlerts";
import { priceAlertSchema } from "@/lib/schemas/price-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PriceAlertModalProps {
  ticker: string;
  children: React.ReactNode;
}

type PriceAlertFormData = z.infer<typeof priceAlertSchema>;

export function PriceAlertModal({ ticker, children }: PriceAlertModalProps) {
  const [open, setOpen] = useState(false);
  const { createAlert, isCreating } = usePriceAlerts();

  const form = useForm<PriceAlertFormData>({
    resolver: zodResolver(priceAlertSchema),
    defaultValues: {
      ticker,
      target_price: 0,
      direction: "above",
    },
  });

  const onSubmit = (data: PriceAlertFormData) => {
    createAlert(data);
    setOpen(false);
    form.reset({ ticker, target_price: 0, direction: "above" });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="bg-[#16213e] border-border text-foreground sm:max-w-[425px] animate-in fade-in zoom-in-95 duration-300">
        <DialogHeader>
          <DialogTitle className="text-green-400">
            Criar Alerta de Preço para {ticker}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Você receberá um e-mail quando o preço atingir o valor alvo.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="target_price" className="text-sm font-medium">
              Preço Alvo
            </label>
            <Input
              id="target_price"
              type="number"
              step="0.01"
              placeholder="Ex: 25.50"
              className={cn(
                "bg-[#1a1a2e] border-border",
                form.formState.errors.target_price && "border-red-500"
              )}
              {...form.register("target_price", { valueAsNumber: true })}
            />
            {form.formState.errors.target_price && (
              <p className="text-sm text-red-400">
                {form.formState.errors.target_price.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="direction" className="text-sm font-medium">
              Direção
            </label>
            <Select
              value={form.watch("direction")}
              onValueChange={(v: "above" | "below") =>
                form.setValue("direction", v)
              }
            >
              <SelectTrigger
                className={cn(
                  "bg-[#1a1a2e] border-border",
                  form.formState.errors.direction && "border-red-500"
                )}
              >
                <SelectValue placeholder="Selecione a direção" />
              </SelectTrigger>
              <SelectContent className="bg-[#16213e] border-border">
                <SelectItem value="above" className="text-green-400">
                  ↑ Acima do preço alvo
                </SelectItem>
                <SelectItem value="below" className="text-red-400">
                  ↓ Abaixo do preço alvo
                </SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.direction && (
              <p className="text-sm text-red-400">
                {form.formState.errors.direction.message}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-border"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-green-400 text-black hover:bg-green-500"
              disabled={isCreating}
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Criar Alerta"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}