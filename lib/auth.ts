import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { randomBytes } from "crypto"
import { createClient } from "./supabase/server"

export interface User {
  id: string
  staff_id: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  status: string
  role: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createSession(userId: string): Promise<string> {
  const sessionId = randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  // For Firebase, we'll store session in cookies only
  // Firebase handles authentication state automatically
  const cookieStore = await cookies()
  cookieStore.set("session", sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
  })

  return sessionId
}

export async function getUser(): Promise<User | null> {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }

  // Get staff profile from staff table
  const { data: staff, error: staffError } = await supabase
    .from('staff')
    .select('*')
    .eq('email', user.email)
    .single()

  if (staffError || !staff || staff.status !== 'active') {
    return null
  }

  return {
    id: user.id,
    staff_id: staff.staff_id,
    email: staff.email,
    firstName: staff.first_name,
    lastName: staff.last_name,
    fullName: `${staff.first_name} ${staff.last_name}`,
    status: staff.status,
    role: staff.staff_id.toLowerCase().includes('admin') ? 'admin' : 'waiter'
  }
}

export async function signOut(): Promise<void> {
  const supabase = createClient()
  await supabase.auth.signOut()
  
  const cookieStore = await cookies()
  cookieStore.delete("session")
}

export async function signIn(staff_id: string, password: string): Promise<User | null> {
  const supabase = createClient()
  
  // Find staff member by staff_id
  const { data: staff, error: staffError } = await supabase
    .from('staff')
    .select('*')
    .eq('staff_id', staff_id)
    .single()
    
  if (staffError || !staff || staff.status !== 'active') {
    return null
  }
  
  // All staff must have email for authentication
  if (!staff.email) {
    console.error('Staff member has no email for authentication')
    return null
  }
  
  // Sign in with Supabase Auth
  const { data, error } = await supabase.auth.signInWithPassword({
    email: staff.email,
    password: password,
  })
  
  if (error || !data.user) {
    return null
  }
  
  const user = {
    id: data.user.id,
    staff_id: staff.staff_id,
    email: staff.email,
    firstName: staff.first_name,
    lastName: staff.last_name,
    fullName: `${staff.first_name} ${staff.last_name}`,
    status: staff.status,
    role: staff.staff_id.toLowerCase().includes('admin') ? 'admin' : 'waiter'
  }
  
  return user
}
