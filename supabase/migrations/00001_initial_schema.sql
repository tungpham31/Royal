-- Royal Database Schema
-- Initial migration

-- ============================================
-- Users Profile Extension (extends auth.users)
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  currency TEXT DEFAULT 'USD',
  timezone TEXT DEFAULT 'America/New_York',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Plaid Items (Bank Connections)
-- ============================================
CREATE TABLE public.plaid_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plaid_item_id TEXT NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  institution_id TEXT,
  institution_name TEXT,
  institution_logo TEXT,
  status TEXT DEFAULT 'active',
  error_code TEXT,
  error_message TEXT,
  cursor TEXT,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_plaid_items_user_id ON public.plaid_items(user_id);

-- ============================================
-- Accounts (from Plaid + Manual)
-- ============================================
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plaid_item_id UUID REFERENCES public.plaid_items(id) ON DELETE SET NULL,
  plaid_account_id TEXT UNIQUE,

  name TEXT NOT NULL,
  official_name TEXT,
  mask TEXT,
  type TEXT NOT NULL,
  subtype TEXT,

  current_balance DECIMAL(19, 4),
  available_balance DECIMAL(19, 4),
  limit_amount DECIMAL(19, 4),
  currency TEXT DEFAULT 'USD',

  is_manual BOOLEAN DEFAULT FALSE,
  is_asset BOOLEAN DEFAULT TRUE,
  include_in_net_worth BOOLEAN DEFAULT TRUE,
  is_hidden BOOLEAN DEFAULT FALSE,
  last_balance_update TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX idx_accounts_plaid_item_id ON public.accounts(plaid_item_id);
CREATE INDEX idx_accounts_type ON public.accounts(type);

-- ============================================
-- Categories
-- ============================================
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  plaid_primary TEXT,
  plaid_detailed TEXT,
  type TEXT DEFAULT 'expense',
  is_system BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_categories_user_id ON public.categories(user_id);
CREATE INDEX idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX idx_categories_plaid ON public.categories(plaid_primary, plaid_detailed);

-- ============================================
-- Transactions
-- ============================================
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,

  plaid_transaction_id TEXT UNIQUE,

  amount DECIMAL(19, 4) NOT NULL,
  currency TEXT DEFAULT 'USD',
  date DATE NOT NULL,
  datetime TIMESTAMPTZ,

  name TEXT NOT NULL,
  merchant_name TEXT,
  original_description TEXT,

  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  plaid_category_primary TEXT,
  plaid_category_detailed TEXT,
  is_manually_categorized BOOLEAN DEFAULT FALSE,

  pending BOOLEAN DEFAULT FALSE,
  is_excluded BOOLEAN DEFAULT FALSE,
  is_transfer BOOLEAN DEFAULT FALSE,

  parent_transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
  is_split BOOLEAN DEFAULT FALSE,

  notes TEXT,
  tags TEXT[],

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX idx_transactions_date ON public.transactions(date DESC);
CREATE INDEX idx_transactions_category_id ON public.transactions(category_id);
CREATE INDEX idx_transactions_plaid_id ON public.transactions(plaid_transaction_id);
CREATE INDEX idx_transactions_user_date ON public.transactions(user_id, date DESC);

-- ============================================
-- Net Worth Snapshots
-- ============================================
CREATE TABLE public.net_worth_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  snapshot_date DATE NOT NULL,
  total_assets DECIMAL(19, 4) NOT NULL,
  total_liabilities DECIMAL(19, 4) NOT NULL,
  net_worth DECIMAL(19, 4) NOT NULL,
  account_balances JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, snapshot_date)
);

CREATE INDEX idx_net_worth_user_date ON public.net_worth_snapshots(user_id, snapshot_date DESC);

-- ============================================
-- Investment Holdings
-- ============================================
CREATE TABLE public.investment_holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  plaid_holding_id TEXT,

  security_id TEXT,
  security_name TEXT,
  security_ticker TEXT,
  security_type TEXT,

  quantity DECIMAL(19, 8),
  cost_basis DECIMAL(19, 4),
  current_value DECIMAL(19, 4),
  price_per_share DECIMAL(19, 4),
  price_as_of TIMESTAMPTZ,

  unrealized_gain_loss DECIMAL(19, 4),
  unrealized_gain_loss_percent DECIMAL(10, 4),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_investment_holdings_user_id ON public.investment_holdings(user_id);
CREATE INDEX idx_investment_holdings_account_id ON public.investment_holdings(account_id);

-- ============================================
-- Category Rules
-- ============================================
CREATE TABLE public.category_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,

  match_type TEXT NOT NULL,
  match_field TEXT NOT NULL,
  match_value TEXT NOT NULL,

  min_amount DECIMAL(19, 4),
  max_amount DECIMAL(19, 4),
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,

  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_category_rules_user_id ON public.category_rules(user_id);
CREATE INDEX idx_category_rules_priority ON public.category_rules(priority DESC);

-- ============================================
-- Enable Row Level Security
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plaid_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.net_worth_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_rules ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies - Profiles
-- ============================================
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- RLS Policies - Plaid Items
-- ============================================
CREATE POLICY "Users can view own plaid items" ON public.plaid_items
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own plaid items" ON public.plaid_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own plaid items" ON public.plaid_items
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own plaid items" ON public.plaid_items
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- RLS Policies - Accounts
-- ============================================
CREATE POLICY "Users can view own accounts" ON public.accounts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own accounts" ON public.accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own accounts" ON public.accounts
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own accounts" ON public.accounts
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- RLS Policies - Categories
-- ============================================
CREATE POLICY "Users can view categories" ON public.categories
  FOR SELECT USING (is_system = TRUE OR auth.uid() = user_id);
CREATE POLICY "Users can insert own categories" ON public.categories
  FOR INSERT WITH CHECK (auth.uid() = user_id AND is_system = FALSE);
CREATE POLICY "Users can update own categories" ON public.categories
  FOR UPDATE USING (auth.uid() = user_id AND is_system = FALSE);
CREATE POLICY "Users can delete own categories" ON public.categories
  FOR DELETE USING (auth.uid() = user_id AND is_system = FALSE);

-- ============================================
-- RLS Policies - Transactions
-- ============================================
CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON public.transactions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON public.transactions
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- RLS Policies - Net Worth Snapshots
-- ============================================
CREATE POLICY "Users can view own snapshots" ON public.net_worth_snapshots
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own snapshots" ON public.net_worth_snapshots
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- RLS Policies - Investment Holdings
-- ============================================
CREATE POLICY "Users can view own holdings" ON public.investment_holdings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own holdings" ON public.investment_holdings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own holdings" ON public.investment_holdings
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own holdings" ON public.investment_holdings
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- RLS Policies - Category Rules
-- ============================================
CREATE POLICY "Users can view own rules" ON public.category_rules
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own rules" ON public.category_rules
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rules" ON public.category_rules
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own rules" ON public.category_rules
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- Triggers - Auto-create profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- Triggers - Auto-update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_plaid_items_updated_at BEFORE UPDATE ON public.plaid_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_investment_holdings_updated_at BEFORE UPDATE ON public.investment_holdings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_category_rules_updated_at BEFORE UPDATE ON public.category_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
