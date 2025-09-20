// Supabase database functions
import { createClient } from './supabase/server'

// Simple query function for compatibility (deprecated - use Supabase client directly)
export async function query(text: string, params: any[] = []) {
  console.warn('query() function is deprecated. Use Supabase client directly.')
  // Return empty results for compatibility
  return { rows: [] }
}

// Staff table helpers
export async function getAllStaff() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .order('created_at', { ascending: false })
    
  if (error) {
    console.error('Error fetching staff:', error)
    throw error
  }
  
  return data || []
}

export async function getStaffById(staff_id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .eq('staff_id', staff_id)
    .single()
    
  if (error) {
    console.error('Error fetching staff member:', error)
    return null
  }
  
  return data
}

export async function createStaff(staffData: any) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('staff')
    .insert(staffData)
    .select()
    .single()
    
  if (error) {
    console.error('Error creating staff:', error)
    throw error
  }
  
  return data
}

export async function updateStaff(staff_id: string, staffData: any) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('staff')
    .update(staffData)
    .eq('staff_id', staff_id)
    .select()
    .single()
    
  if (error) {
    console.error('Error updating staff:', error)
    throw error
  }
  
  return data
}

// Inventory table helpers
export async function getAllInventory() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .order('name')
    
  if (error) {
    console.error('Error fetching inventory:', error)
    throw error
  }
  
  return data || []
}

export async function getInventoryByCategory(category: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .eq('category', category)
    .order('name')
    
  if (error) {
    console.error('Error fetching inventory by category:', error)
    throw error
  }
  
  return data || []
}

export async function updateInventoryQuantity(item_id: string, quantity: number) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('inventory')
    .update({ quantity })
    .eq('item_id', item_id)
    .select()
    .single()
    
  if (error) {
    console.error('Error updating inventory quantity:', error)
    throw error
  }
  
  return data
}

// Sales table helpers
export async function getAllSales() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .order('sale_date', { ascending: false })
    
  if (error) {
    console.error('Error fetching sales:', error)
    throw error
  }
  
  return data || []
}

export async function createSale(saleData: any) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('sales')
    .insert(saleData)
    .select()
    .single()
    
  if (error) {
    console.error('Error creating sale:', error)
    throw error
  }
  
  return data
}

export async function getSalesByStaff(staff_member: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .eq('staff_member', staff_member)
    .order('sale_date', { ascending: false })
    
  if (error) {
    console.error('Error fetching sales by staff:', error)
    throw error
  }
  
  return data || []
}

// Generic helper functions
export async function getTable(tableName: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    
  if (error) {
    console.error('Error fetching table:', error)
    throw error
  }
  
  return data || []
}

export { createClient as supabase }
export default createClient