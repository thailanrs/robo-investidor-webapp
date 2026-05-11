export interface PriceAlert {
  id: string;
  user_id: string;
  ticker: string;
  target_price: number;
  direction: "above" | "below";
  triggered_at: string | null;
  created_at: string;
}

export interface CreatePriceAlertPayload {
  ticker: string;
  target_price: number;
  direction: "above" | "below";
}