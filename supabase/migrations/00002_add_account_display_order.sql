-- Add display_order column to accounts table for drag-and-drop reordering
ALTER TABLE public.accounts ADD COLUMN display_order INTEGER DEFAULT 0;

-- Create index for efficient ordering queries (per user, per type)
CREATE INDEX idx_accounts_display_order ON public.accounts(user_id, type, display_order);

-- Initialize display_order based on created_at for existing accounts
-- This preserves the current visual order for existing users
WITH ordered_accounts AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, type
      ORDER BY created_at DESC
    ) - 1 as new_order
  FROM public.accounts
)
UPDATE public.accounts
SET display_order = ordered_accounts.new_order
FROM ordered_accounts
WHERE public.accounts.id = ordered_accounts.id;
