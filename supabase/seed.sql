-- Royal Seed Data
-- Default system categories

INSERT INTO public.categories (name, icon, color, type, is_system, plaid_primary) VALUES
-- Income Categories
('Income', 'DollarSign', '#10B981', 'income', TRUE, 'INCOME'),
('Salary', 'Briefcase', '#10B981', 'income', TRUE, 'INCOME'),
('Investments', 'TrendingUp', '#10B981', 'income', TRUE, 'INCOME'),
('Refunds', 'RotateCcw', '#10B981', 'income', TRUE, 'INCOME'),

-- Expense Categories
('Food & Drink', 'UtensilsCrossed', '#F59E0B', 'expense', TRUE, 'FOOD_AND_DRINK'),
('Groceries', 'ShoppingCart', '#F59E0B', 'expense', TRUE, 'FOOD_AND_DRINK'),
('Restaurants', 'Utensils', '#F59E0B', 'expense', TRUE, 'FOOD_AND_DRINK'),
('Coffee Shops', 'Coffee', '#F59E0B', 'expense', TRUE, 'FOOD_AND_DRINK'),

('Shopping', 'ShoppingBag', '#EC4899', 'expense', TRUE, 'GENERAL_MERCHANDISE'),
('Clothing', 'Shirt', '#EC4899', 'expense', TRUE, 'GENERAL_MERCHANDISE'),
('Electronics', 'Laptop', '#EC4899', 'expense', TRUE, 'GENERAL_MERCHANDISE'),
('Home Improvement', 'Home', '#EC4899', 'expense', TRUE, 'GENERAL_MERCHANDISE'),

('Transportation', 'Car', '#3B82F6', 'expense', TRUE, 'TRANSPORTATION'),
('Gas', 'Fuel', '#3B82F6', 'expense', TRUE, 'TRANSPORTATION'),
('Parking', 'ParkingCircle', '#3B82F6', 'expense', TRUE, 'TRANSPORTATION'),
('Public Transit', 'Bus', '#3B82F6', 'expense', TRUE, 'TRANSPORTATION'),
('Rideshare', 'Car', '#3B82F6', 'expense', TRUE, 'TRANSPORTATION'),

('Entertainment', 'Tv', '#8B5CF6', 'expense', TRUE, 'ENTERTAINMENT'),
('Streaming', 'Play', '#8B5CF6', 'expense', TRUE, 'ENTERTAINMENT'),
('Movies & Events', 'Ticket', '#8B5CF6', 'expense', TRUE, 'ENTERTAINMENT'),
('Games', 'Gamepad2', '#8B5CF6', 'expense', TRUE, 'ENTERTAINMENT'),

('Bills & Utilities', 'Receipt', '#EF4444', 'expense', TRUE, 'RENT_AND_UTILITIES'),
('Rent', 'Building', '#EF4444', 'expense', TRUE, 'RENT_AND_UTILITIES'),
('Electricity', 'Zap', '#EF4444', 'expense', TRUE, 'RENT_AND_UTILITIES'),
('Internet', 'Wifi', '#EF4444', 'expense', TRUE, 'RENT_AND_UTILITIES'),
('Phone', 'Phone', '#EF4444', 'expense', TRUE, 'RENT_AND_UTILITIES'),

('Health', 'Heart', '#14B8A6', 'expense', TRUE, 'MEDICAL'),
('Doctor', 'Stethoscope', '#14B8A6', 'expense', TRUE, 'MEDICAL'),
('Pharmacy', 'Pill', '#14B8A6', 'expense', TRUE, 'MEDICAL'),
('Gym', 'Dumbbell', '#14B8A6', 'expense', TRUE, 'MEDICAL'),

('Travel', 'Plane', '#0EA5E9', 'expense', TRUE, 'TRAVEL'),
('Hotels', 'Hotel', '#0EA5E9', 'expense', TRUE, 'TRAVEL'),
('Flights', 'Plane', '#0EA5E9', 'expense', TRUE, 'TRAVEL'),

('Personal', 'User', '#6B7280', 'expense', TRUE, 'PERSONAL_CARE'),
('Subscriptions', 'CreditCard', '#6B7280', 'expense', TRUE, 'PERSONAL_CARE'),
('Education', 'GraduationCap', '#6B7280', 'expense', TRUE, 'PERSONAL_CARE'),

('Transfers', 'ArrowRightLeft', '#6B7280', 'transfer', TRUE, 'TRANSFER_IN'),
('Uncategorized', 'HelpCircle', '#9CA3AF', 'expense', TRUE, NULL);
