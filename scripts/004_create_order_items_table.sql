-- Create order_items table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  special_requests TEXT,
  status VARCHAR(20) DEFAULT 'ordered' CHECK (status IN ('ordered', 'preparing', 'ready', 'served')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Create policies for order_items table
-- Users can view order items for orders they have access to
CREATE POLICY "order_items_select_via_orders" ON public.order_items 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE id = order_id AND (
        waiter_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM public.users 
          WHERE id = auth.uid() AND role = 'admin'
        )
      )
    )
  );

-- Users can insert order items for orders they have access to
CREATE POLICY "order_items_insert_via_orders" ON public.order_items 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE id = order_id AND waiter_id = auth.uid()
    )
  );

-- Users can update order items for orders they have access to
CREATE POLICY "order_items_update_via_orders" ON public.order_items 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE id = order_id AND (
        waiter_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM public.users 
          WHERE id = auth.uid() AND role = 'admin'
        )
      )
    )
  );
