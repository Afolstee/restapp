// Supabase database functions
import { createClient } from './supabase/server'

// Simple query function for compatibility (deprecated - use Supabase client directly)
export async function query(text: string, params: any[] = []) {
  console.warn('query() function is deprecated. Use Supabase client directly.')
  // Return empty results for compatibility
  return { rows: [] }
}

// Supabase helper functions
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

export async function getRecord(tableName: string, id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .eq('id', id)
    .single()
    
  if (error) {
    console.error('Error fetching record:', error)
    return null
  }
  
  return data
}

export async function insertRecord(tableName: string, data: any) {
  const supabase = createClient()
  const { data: result, error } = await supabase
    .from(tableName)
    .insert(data)
    .select()
    .single()
    
  if (error) {
    console.error('Error inserting record:', error)
    throw error
  }
  
  return result
}

export async function updateRecord(tableName: string, id: string, data: any) {
  const supabase = createClient()
  const { data: result, error } = await supabase
    .from(tableName)
    .update(data)
    .eq('id', id)
    .select()
    .single()
    
  if (error) {
    console.error('Error updating record:', error)
    throw error
  }
  
  return result
}

export async function deleteRecord(tableName: string, id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from(tableName)
    .delete()
    .eq('id', id)
    
  if (error) {
    console.error('Error deleting record:', error)
    throw error
  }
  
  return true
}

export { createClient as supabase }
export default createClient