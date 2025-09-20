import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[Setup API] Starting admin staff creation...")

    const { email, password, first_name, last_name, staff_id } = await request.json()
    console.log("[Setup API] Received data:", { email, first_name, last_name, staff_id })

    if (!email || !password || !first_name || !last_name || !staff_id) {
      console.log("[Setup API] Missing required fields")
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    const supabase = createClient()

    // Check if staff already exists (by staff_id or email)
    console.log("[Setup API] Checking if staff exists...")
    const { data: existingStaff, error: checkError } = await supabase
      .from('staff')
      .select('staff_id, email')
      .or(`staff_id.eq.${staff_id},email.eq.${email}`)
      .maybeSingle()

    if (checkError) {
      console.error("[Setup API] Error checking existing staff:", checkError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    if (existingStaff) {
      console.log("[Setup API] Staff already exists")
      return NextResponse.json({ error: "Staff member or email already exists" }, { status: 409 })
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

    // Create staff profile
    console.log("[Setup API] Creating staff profile...")
    const { data: staff, error: insertError } = await supabase
      .from('staff')
      .insert({
        staff_id,
        first_name,
        last_name,
        email,
        status: 'active'
      })
      .select('staff_id, first_name, last_name, email, status')
      .single()

    if (insertError) {
      console.error("[Setup API] Error creating staff:", insertError)
      return NextResponse.json({ error: "Failed to create staff" }, { status: 500 })
    }

    console.log("[Setup API] Staff created successfully:", staff)

    return NextResponse.json({
      message: "Admin staff created successfully",
      staff: {
        staff_id: staff.staff_id,
        first_name: staff.first_name,
        last_name: staff.last_name,
        email: staff.email,
        status: staff.status,
      },
    })
  } catch (error: any) {
    console.error("[Setup API] Detailed error:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}