import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { query } from "./db"
import { randomBytes } from "crypto"

export interface User {
  id: number
  email: string
  name: string
  role: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createSession(userId: number): Promise<string> {
  const sessionId = randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  await query("INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)", [sessionId, userId, expiresAt])

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
  const cookieStore = await cookies()
  const sessionId = cookieStore.get("session")?.value

  if (!sessionId) return null

  const result = await query(
    `
    SELECT u.id, u.email, u.name, u.role 
    FROM users u 
    JOIN sessions s ON u.id = s.user_id 
    WHERE s.id = $1 AND s.expires_at > NOW()
  `,
    [sessionId],
  )

  return result.rows[0] || null
}

export async function signOut(): Promise<void> {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get("session")?.value

  if (sessionId) {
    await query("DELETE FROM sessions WHERE id = $1", [sessionId])
  }

  cookieStore.delete("session")
}

export async function signIn(email: string, password: string): Promise<User | null> {
  const result = await query("SELECT id, email, name, role, password_hash FROM users WHERE email = $1", [email])

  const user = result.rows[0]
  if (!user) return null

  const isValid = await verifyPassword(password, user.password_hash)
  if (!isValid) return null

  await createSession(user.id)

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  }
}
