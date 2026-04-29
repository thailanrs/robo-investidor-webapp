CREATE TYPE dividend_type AS ENUM (
  'DIVIDENDO',
  'JCP',
  'RENDIMENTO_FII',
  'AMORTIZACAO'
);

CREATE TABLE dividends (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticker       varchar(10) NOT NULL,
  type         dividend_type NOT NULL,
  amount       numeric(12,2) NOT NULL CHECK (amount > 0),
  quantity     numeric(12,4),          -- qtd de cotas/ações na data do pagamento (opcional, para calcular yield)
  payment_date date NOT NULL,
  notes        text,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE dividends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own dividends"
  ON dividends FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Índices de performance
CREATE INDEX dividends_user_id_idx ON dividends(user_id);
CREATE INDEX dividends_payment_date_idx ON dividends(payment_date DESC);
CREATE INDEX dividends_ticker_idx ON dividends(ticker);
