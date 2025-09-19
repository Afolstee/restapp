-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  waiter_id UUID NOT NULL REFERENCES public.users(id),
  table_number INTEGER NOT NULL,
  customer_name VARCHAR(255),
  customer_phone VARCHAR(20),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'served', 'paid', 'cancelled')),
  order_type VARCHAR(20) NOT NULL DEFAULT 'dine-in' CHECK (order_type IN ('dine-in', 'takeaway', 'delivery')),
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'card', 'mobile')),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  special_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create policies for orders table
-- Waiters can view their own orders
CREATE POLICY "waiter_select_own_orders" ON public.orders 
  FOR SELECT USING (waiter_id = auth.uid());

-- Waiters can insert their own orders
CREATE POLICY "waiter_insert_orders" ON public.orders 
  FOR INSERT WITH CHECK (waiter_id = auth.uid());

-- Waiters can update their own orders
CREATE POLICY "waiter_update_own_orders" ON public.orders 
  FOR UPDATE USING (waiter_id = auth.uid());

-- Admin can view all orders
CREATE POLICY "admin_select_all_orders" ON public.orders 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin can update all orders
CREATE POLICY "admin_update_orders" ON public.orders 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
