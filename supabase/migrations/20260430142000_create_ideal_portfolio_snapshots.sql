-- Migration: Create ideal_portfolio_snapshots table
CREATE TABLE IF NOT EXISTS ideal_portfolio_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    snapshot_date DATE NOT NULL UNIQUE,
    tickers JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilita RLS na tabela
ALTER TABLE ideal_portfolio_snapshots ENABLE ROW LEVEL SECURITY;

-- Permite leitura de snapshots autenticados ou públicos
CREATE POLICY "Allow authenticated read access to ideal_portfolio_snapshots" ON ideal_portfolio_snapshots
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow public read access to ideal_portfolio_snapshots" ON ideal_portfolio_snapshots
    FOR SELECT TO anon USING (true);
