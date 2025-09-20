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

  // Store session in database for security
  const supabase = createClient()
  await supabase
    .from('user_sessions')
    .insert({
      session_id: sessionId,
      user_id: userId,
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString()
    })

  // Store only session ID in cookie
  const cookieStore = await cookies()
  cookieStore.set("session", sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    expires: expiresAt,
  })

  return sessionId
}

export async function getUser(): Promise<User | null> {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get("session")?.value
  
  if (!sessionId) {
    return null
  }
  
  try {
    // Verify session from database
    const supabase = createClient()
    const { data: session, error: sessionError } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single()

    if (sessionError || !session) {
      return null
    }

    // Check if session is expired
    const expiresAt = new Date(session.expires_at)
    if (expiresAt < new Date()) {
      // Clean up expired session
      await supabase
        .from('user_sessions')
        .delete()
        .eq('session_id', sessionId)
      return null
    }
    
    // Get user from database using session user_id
    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .select('*')
      .eq('staff_id', session.user_id)
      .single()

    if (staffError || !staff || staff.status !== 'active') {
      return null
    }

    return {
      id: staff.staff_id,
      staff_id: staff.staff_id,
      email: staff.email || '',
      firstName: staff.first_name,
      lastName: staff.last_name,
      fullName: `${staff.first_name} ${staff.last_name}`,
      status: staff.status,
      role: staff.role || 'waitstaff'
    }
  } catch (error) {
    console.error("Session validation error:", error)
    return null
  }
}

export async function signOut(): Promise<void> {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get("session")?.value
  
  if (sessionId) {
    // Remove session from database
    const supabase = createClient()
    await supabase
      .from('user_sessions')
      .delete()
      .eq('session_id', sessionId)
  }
  
  // Delete session cookie
  cookieStore.delete("session")
}

export async function signIn(firstName: string, password: string): Promise<User | null> {
  const supabase = createClient()
  
  // Find all staff members with matching first name (case insensitive)
  const { data: staffList, error: staffError } = await supabase
    .from('staff')
    .select('*')
    .ilike('first_name', firstName)
    .eq('status', 'active')
    
  if (staffError || !staffList || staffList.length === 0) {
    return null
  }
  
  // Try password verification against all matching staff members
  for (const staff of staffList) {
    let passwordValid = false
    
    // Handle missing password_hash (NULL) - treat as needing migration
    if (!staff.password_hash) {
      // No password set yet - check if password equals staff_id and set it
      if (password === staff.staff_id) {
        passwordValid = true
        const hashedPassword = await hashPassword(password)
        await supabase
          .from('staff')
          .update({ password_hash: hashedPassword })
          .eq('staff_id', staff.staff_id)
      }
    } else if (staff.password_hash === staff.staff_id) {
      // Still plaintext - verify directly and hash it
      passwordValid = password === staff.staff_id
      if (passwordValid) {
        const hashedPassword = await hashPassword(password)
        await supabase
          .from('staff')
          .update({ password_hash: hashedPassword })
          .eq('staff_id', staff.staff_id)
      }
    } else {
      // Already hashed - use bcrypt verification
      passwordValid = await verifyPassword(password, staff.password_hash)
    }
    
    // If password is valid for this staff member, return the user
    if (passwordValid) {
      const user = {
        id: staff.staff_id,
        staff_id: staff.staff_id,
        email: staff.email || '',
        firstName: staff.first_name,
        lastName: staff.last_name,
        fullName: `${staff.first_name} ${staff.last_name}`,
        status: staff.status,
        role: staff.role || 'waitstaff'
      }
      
      // Create secure session
      await createSession(user.id)
      
      return user
    }
  }
  
  // No valid password found for any staff member with this first name
  return null
}
