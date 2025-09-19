import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { randomBytes } from "crypto"
import { signIn as firebaseSignIn, getCurrentUserProfile } from "./firebase/auth"

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
  // Use Firebase Auth to get current user
  return await getCurrentUserProfile()
}

export async function signOut(): Promise<void> {
  // Clear cookies and Firebase auth
  const { signOut: firebaseSignOut } = await import('./firebase/auth')
  await firebaseSignOut()
  
  const cookieStore = await cookies()
  cookieStore.delete("session")
}

export async function signIn(identifier: string, password: string): Promise<User | null> {
  // Use Firebase authentication
  const user = await firebaseSignIn(identifier, password)
  
  if (user) {
    // Create session for compatibility
    await createSession(user.id)
  }
  
  return user
}
