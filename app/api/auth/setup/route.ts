import { type NextRequest, NextResponse } from "next/server"
import { hashPassword } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[Setup API] Starting admin user creation...")

    const { email, password, name, role } = await request.json()
    console.log("[Setup API] Received data:", { email, name, role })

    if (!email || !password || !name || !role) {
      console.log("[Setup API] Missing required fields")
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    const supabase = createClient()

    // Check if user already exists
    console.log("[Setup API] Checking if user exists...")
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (checkError) {
      console.error("[Setup API] Error checking existing user:", checkError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    if (existingUser) {
      console.log("[Setup API] User already exists")
      return NextResponse.json({ error: "User already exists" }, { status: 409 })
    }

    // Create auth user first
    console.log("[Setup API] Creating Supabase auth user...")
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      console.error("[Setup API] Error creating auth user:", authError)
      return NextResponse.json({ error: "Failed to create auth user" }, { status: 500 })
    }

    // Create user profile (matching existing schema)
    console.log("[Setup API] Creating user profile...")
    const passwordHash = await hashPassword(password)
    const { data: user, error: insertError } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        name,
        role
      })
      .select('id, email, name, role')
      .single()

    if (insertError) {
      console.error("[Setup API] Error creating user:", insertError)
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
    }

    console.log("[Setup API] User created successfully:", user)

    return NextResponse.json({
      message: "Admin user created successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("[Setup API] Detailed error:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}