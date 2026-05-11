import { z } from "zod";

const DIRECTIONS = ["above", "below"] as const;

export const priceAlertSchema = z.object({
  ticker: z.string().min(1, "Ticker é obrigatório").max(10, "Ticker muito longo"),
  target_price: z.number().positive("Preço alvo deve ser positivo"),
  direction: z.union([z.literal("above"), z.literal("below")]),
});

export type PriceAlertInput = z.infer<typeof priceAlertSchema>;