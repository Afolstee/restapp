import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { randomBytes } from "crypto"
import { createClient } from "./supabase/server"

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  userPassword: string
  role: string
  isActive?: boolean
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

  // Get user profile from users table
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return null
  }

  return {
    id: profile.id,
    email: profile.email,
    firstName: profile.first_name,
    lastName: profile.last_name,
    fullName: `${profile.first_name} ${profile.last_name}`,
    userPassword: profile.user_password,
    role: profile.role,
    isActive: profile.is_active
  }
}

export async function signOut(): Promise<void> {
  const supabase = createClient()
  await supabase.auth.signOut()
  
  const cookieStore = await cookies()
  cookieStore.delete("session")
}

export async function signIn(identifier: string, password: string): Promise<User | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: identifier,
    password: password,
  })
  
  if (error || !data.user) {
    return null
  }
  
  // Get user profile
  const user = await getUser()
  
  if (user) {
    // Create session for compatibility
    await createSession(user.id)
  }
  
  return user
}
