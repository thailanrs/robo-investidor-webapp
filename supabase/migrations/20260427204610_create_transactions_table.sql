CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    ticker VARCHAR(20) NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('COMPRA', 'VENDA')),
    quantity NUMERIC NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC NOT NULL CHECK (unit_price >= 0),
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'Users can insert their own transactions.'
    ) THEN
        CREATE POLICY "Users can insert their own transactions."
            ON public.transactions FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'Users can view their own transactions.'
    ) THEN
        CREATE POLICY "Users can view their own transactions."
            ON public.transactions FOR SELECT
            USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'Users can update their own transactions.'
    ) THEN
        CREATE POLICY "Users can update their own transactions."
            ON public.transactions FOR UPDATE
            USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'Users can delete their own transactions.'
    ) THEN
        CREATE POLICY "Users can delete their own transactions."
            ON public.transactions FOR DELETE
            USING (auth.uid() = user_id);
    END IF;
END $$;
