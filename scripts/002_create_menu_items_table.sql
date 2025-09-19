-- Create menu_items table
CREATE TABLE IF NOT EXISTS public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  image_url VARCHAR(500),
  is_available BOOLEAN DEFAULT true,
  preparation_time INTEGER DEFAULT 15, -- in minutes
  ingredients TEXT[],
  allergens TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- Create policies for menu_items table
CREATE POLICY "menu_items_select_all" ON public.menu_items 
  FOR SELECT USING (true); -- Everyone can view menu items

-- Only admin can modify menu items
CREATE POLICY "admin_insert_menu_items" ON public.menu_items 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "admin_update_menu_items" ON public.menu_items 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "admin_delete_menu_items" ON public.menu_items 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Insert sample menu items
INSERT INTO public.menu_items (name, description, price, category, is_available) VALUES
('Margherita Pizza', 'Classic pizza with tomato sauce, mozzarella, and fresh basil', 12.99, 'Pizza', true),
('Caesar Salad', 'Crisp romaine lettuce with Caesar dressing, croutons, and parmesan', 8.99, 'Salads', true),
('Grilled Chicken Breast', 'Tender grilled chicken served with seasonal vegetables', 16.99, 'Main Course', true),
('Fish and Chips', 'Beer-battered cod with crispy fries and tartar sauce', 14.99, 'Main Course', true),
('Chocolate Brownie', 'Warm chocolate brownie served with vanilla ice cream', 6.99, 'Desserts', true),
('Coca Cola', 'Classic Coca Cola soft drink', 2.99, 'Beverages', true),
('House Wine Red', 'Our signature red wine blend', 7.99, 'Beverages', true),
('Craft Beer', 'Local craft beer on tap', 5.99, 'Beverages', true);
