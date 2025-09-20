import { type NextRequest, NextResponse } from "next/server"
import { signIn } from "@/lib/auth"

// Simple in-memory rate limiting
const loginAttempts = new Map<string, { count: number; resetTime: number }>()
const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000 // 15 minutes

export async function POST(request: NextRequest) {
  try {
    const { firstName, password } = await request.json()

    if (!firstName || !password) {
      return NextResponse.json({ error: "First name and password are required" }, { status: 400 })
    }

    // Rate limiting check
    const clientIP = request.ip || request.headers.get("x-forwarded-for") || "unknown"
    const rateLimitKey = `${clientIP}:${firstName.toLowerCase()}`
    
    const now = Date.now()
    const attempts = loginAttempts.get(rateLimitKey)
    
    if (attempts) {
      if (now < attempts.resetTime) {
        if (attempts.count >= MAX_ATTEMPTS) {
          console.warn(`Rate limit exceeded for ${rateLimitKey}`)
          return NextResponse.json({ error: "Too many login attempts. Please try again later." }, { status: 429 })
        }
      } else {
        // Reset window
        loginAttempts.delete(rateLimitKey)
      }
    }

    const user = await signIn(firstName, password)

    if (!user) {
      // Track failed attempt
      const currentAttempts = loginAttempts.get(rateLimitKey)
      if (currentAttempts && now < currentAttempts.resetTime) {
        currentAttempts.count += 1
      } else {
        loginAttempts.set(rateLimitKey, { count: 1, resetTime: now + WINDOW_MS })
      }
      
      console.warn(`Failed login attempt for firstName: ${firstName}, IP: ${clientIP}`)
      return NextResponse.json({ error: "Invalid first name or password" }, { status: 401 })
    }

    // Clear rate limit on successful login
    loginAttempts.delete(rateLimitKey)
    
    console.log(`Successful login for ${user.staff_id} (${firstName})`)
    return NextResponse.json({ user })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
