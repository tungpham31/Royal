export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          currency: string;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          currency?: string;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          currency?: string;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      plaid_items: {
        Row: {
          id: string;
          user_id: string;
          plaid_item_id: string;
          access_token: string;
          institution_id: string | null;
          institution_name: string | null;
          institution_logo: string | null;
          status: string;
          error_code: string | null;
          error_message: string | null;
          cursor: string | null;
          last_synced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plaid_item_id: string;
          access_token: string;
          institution_id?: string | null;
          institution_name?: string | null;
          institution_logo?: string | null;
          status?: string;
          error_code?: string | null;
          error_message?: string | null;
          cursor?: string | null;
          last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plaid_item_id?: string;
          access_token?: string;
          institution_id?: string | null;
          institution_name?: string | null;
          institution_logo?: string | null;
          status?: string;
          error_code?: string | null;
          error_message?: string | null;
          cursor?: string | null;
          last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      accounts: {
        Row: {
          id: string;
          user_id: string;
          plaid_item_id: string | null;
          plaid_account_id: string | null;
          name: string;
          official_name: string | null;
          mask: string | null;
          type: string;
          subtype: string | null;
          current_balance: number | null;
          available_balance: number | null;
          limit_amount: number | null;
          currency: string;
          is_manual: boolean;
          is_asset: boolean;
          include_in_net_worth: boolean;
          is_hidden: boolean;
          display_order?: number;
          last_balance_update: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plaid_item_id?: string | null;
          plaid_account_id?: string | null;
          name: string;
          official_name?: string | null;
          mask?: string | null;
          type: string;
          subtype?: string | null;
          current_balance?: number | null;
          available_balance?: number | null;
          limit_amount?: number | null;
          currency?: string;
          is_manual?: boolean;
          is_asset?: boolean;
          include_in_net_worth?: boolean;
          is_hidden?: boolean;
          display_order?: number;
          last_balance_update?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plaid_item_id?: string | null;
          plaid_account_id?: string | null;
          name?: string;
          official_name?: string | null;
          mask?: string | null;
          type?: string;
          subtype?: string | null;
          current_balance?: number | null;
          available_balance?: number | null;
          limit_amount?: number | null;
          currency?: string;
          is_manual?: boolean;
          is_asset?: boolean;
          include_in_net_worth?: boolean;
          is_hidden?: boolean;
          display_order?: number;
          last_balance_update?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          icon: string | null;
          color: string | null;
          parent_id: string | null;
          plaid_primary: string | null;
          plaid_detailed: string | null;
          type: string;
          is_system: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          icon?: string | null;
          color?: string | null;
          parent_id?: string | null;
          plaid_primary?: string | null;
          plaid_detailed?: string | null;
          type?: string;
          is_system?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          icon?: string | null;
          color?: string | null;
          parent_id?: string | null;
          plaid_primary?: string | null;
          plaid_detailed?: string | null;
          type?: string;
          is_system?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          account_id: string;
          plaid_transaction_id: string | null;
          amount: number;
          currency: string;
          date: string;
          datetime: string | null;
          name: string;
          merchant_name: string | null;
          original_description: string | null;
          category_id: string | null;
          plaid_category_primary: string | null;
          plaid_category_detailed: string | null;
          pending: boolean;
          is_excluded: boolean;
          is_transfer: boolean;
          parent_transaction_id: string | null;
          is_split: boolean;
          notes: string | null;
          tags: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          account_id: string;
          plaid_transaction_id?: string | null;
          amount: number;
          currency?: string;
          date: string;
          datetime?: string | null;
          name: string;
          merchant_name?: string | null;
          original_description?: string | null;
          category_id?: string | null;
          plaid_category_primary?: string | null;
          plaid_category_detailed?: string | null;
          pending?: boolean;
          is_excluded?: boolean;
          is_transfer?: boolean;
          parent_transaction_id?: string | null;
          is_split?: boolean;
          notes?: string | null;
          tags?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          account_id?: string;
          plaid_transaction_id?: string | null;
          amount?: number;
          currency?: string;
          date?: string;
          datetime?: string | null;
          name?: string;
          merchant_name?: string | null;
          original_description?: string | null;
          category_id?: string | null;
          plaid_category_primary?: string | null;
          plaid_category_detailed?: string | null;
          pending?: boolean;
          is_excluded?: boolean;
          is_transfer?: boolean;
          parent_transaction_id?: string | null;
          is_split?: boolean;
          notes?: string | null;
          tags?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      net_worth_snapshots: {
        Row: {
          id: string;
          user_id: string;
          snapshot_date: string;
          total_assets: number;
          total_liabilities: number;
          net_worth: number;
          account_balances: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          snapshot_date: string;
          total_assets: number;
          total_liabilities: number;
          net_worth: number;
          account_balances?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          snapshot_date?: string;
          total_assets?: number;
          total_liabilities?: number;
          net_worth?: number;
          account_balances?: Json | null;
          created_at?: string;
        };
      };
      investment_holdings: {
        Row: {
          id: string;
          user_id: string;
          account_id: string;
          plaid_holding_id: string | null;
          security_id: string | null;
          security_name: string | null;
          security_ticker: string | null;
          security_type: string | null;
          quantity: number | null;
          cost_basis: number | null;
          current_value: number | null;
          price_per_share: number | null;
          price_as_of: string | null;
          unrealized_gain_loss: number | null;
          unrealized_gain_loss_percent: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          account_id: string;
          plaid_holding_id?: string | null;
          security_id?: string | null;
          security_name?: string | null;
          security_ticker?: string | null;
          security_type?: string | null;
          quantity?: number | null;
          cost_basis?: number | null;
          current_value?: number | null;
          price_per_share?: number | null;
          price_as_of?: string | null;
          unrealized_gain_loss?: number | null;
          unrealized_gain_loss_percent?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          account_id?: string;
          plaid_holding_id?: string | null;
          security_id?: string | null;
          security_name?: string | null;
          security_ticker?: string | null;
          security_type?: string | null;
          quantity?: number | null;
          cost_basis?: number | null;
          current_value?: number | null;
          price_per_share?: number | null;
          price_as_of?: string | null;
          unrealized_gain_loss?: number | null;
          unrealized_gain_loss_percent?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      category_rules: {
        Row: {
          id: string;
          user_id: string;
          category_id: string;
          match_type: string;
          match_field: string;
          match_value: string;
          min_amount: number | null;
          max_amount: number | null;
          account_id: string | null;
          priority: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id: string;
          match_type: string;
          match_field: string;
          match_value: string;
          min_amount?: number | null;
          max_amount?: number | null;
          account_id?: string | null;
          priority?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: string;
          match_type?: string;
          match_field?: string;
          match_value?: string;
          min_amount?: number | null;
          max_amount?: number | null;
          account_id?: string | null;
          priority?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      holdings: {
        Row: {
          id: string;
          user_id: string;
          account_id: string;
          plaid_holding_id: string | null;
          security_id: string | null;
          ticker_symbol: string | null;
          security_name: string | null;
          quantity: number;
          cost_basis: number | null;
          value: number | null;
          currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          account_id: string;
          plaid_holding_id?: string | null;
          security_id?: string | null;
          ticker_symbol?: string | null;
          security_name?: string | null;
          quantity?: number;
          cost_basis?: number | null;
          value?: number | null;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          account_id?: string;
          plaid_holding_id?: string | null;
          security_id?: string | null;
          ticker_symbol?: string | null;
          security_name?: string | null;
          quantity?: number;
          cost_basis?: number | null;
          value?: number | null;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      net_worth_history: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          total_assets: number;
          total_liabilities: number;
          net_worth: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          total_assets?: number;
          total_liabilities?: number;
          net_worth?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          total_assets?: number;
          total_liabilities?: number;
          net_worth?: number;
          created_at?: string;
        };
      };
      dashboard_preferences: {
        Row: {
          id: string;
          user_id: string;
          widget_layout: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          widget_layout?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          widget_layout?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
