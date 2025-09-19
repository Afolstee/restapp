-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON public.menu_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON public.order_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate order totals
CREATE OR REPLACE FUNCTION calculate_order_total(order_uuid UUID)
RETURNS VOID AS $$
DECLARE
    order_subtotal DECIMAL(10, 2);
    tax_rate DECIMAL(5, 4) := 0.0875; -- 8.75% tax rate
    calculated_tax DECIMAL(10, 2);
    order_discount DECIMAL(10, 2);
    final_total DECIMAL(10, 2);
BEGIN
    -- Calculate subtotal from order items
    SELECT COALESCE(SUM(total_price), 0) INTO order_subtotal
    FROM public.order_items
    WHERE order_id = order_uuid;
    
    -- Get discount amount
    SELECT COALESCE(discount_amount, 0) INTO order_discount
    FROM public.orders
    WHERE id = order_uuid;
    
    -- Calculate tax on subtotal minus discount
    calculated_tax := (order_subtotal - order_discount) * tax_rate;
    
    -- Calculate final total
    final_total := order_subtotal - order_discount + calculated_tax;
    
    -- Update the order
    UPDATE public.orders
    SET 
        subtotal = order_subtotal,
        tax_amount = calculated_tax,
        total_amount = final_total,
        updated_at = NOW()
    WHERE id = order_uuid;
END;
$$ LANGUAGE plpgsql;

-- Trigger to recalculate order totals when order items change
CREATE OR REPLACE FUNCTION recalculate_order_total()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM calculate_order_total(OLD.order_id);
        RETURN OLD;
    ELSE
        PERFORM calculate_order_total(NEW.order_id);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_items_total_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.order_items
    FOR EACH ROW EXECUTE FUNCTION recalculate_order_total();
