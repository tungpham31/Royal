-- Drop unused net_worth_snapshots table
-- This table was created but never used. The app uses net_worth_history instead.

DROP TABLE IF EXISTS public.net_worth_snapshots;
