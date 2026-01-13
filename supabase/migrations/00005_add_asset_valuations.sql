-- Create asset_valuations table for tracking manual asset value history
CREATE TABLE public.asset_valuations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  valuation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  value DECIMAL(19, 4) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(account_id, valuation_date)
);

-- RLS policies
ALTER TABLE public.asset_valuations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own valuations"
  ON public.asset_valuations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own valuations"
  ON public.asset_valuations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own valuations"
  ON public.asset_valuations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own valuations"
  ON public.asset_valuations FOR DELETE
  USING (auth.uid() = user_id);

-- Index for efficient queries
CREATE INDEX idx_asset_valuations_account_date
  ON public.asset_valuations(account_id, valuation_date DESC);
