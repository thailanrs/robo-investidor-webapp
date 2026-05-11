import { z } from "zod";

export const priceAlertSchema = z.object({
  ticker: z.string().min(1, "Ticker é obrigatório").max(10, "Ticker muito longo"),
  target_price: z.number().positive("Preço alvo deve ser positivo"),
  direction: z.enum(["above", "below"] as const, {
    errorMap: () => ({ message: 'Direção deve ser "above" ou "below"' }),
  }),
});

export type PriceAlertInput = z.infer<typeof priceAlertSchema>;