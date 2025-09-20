import { type NextRequest, NextResponse } from "next/server"
import { signIn } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { staff_id, password } = await request.json()

    if (!staff_id || !password) {
      return NextResponse.json({ error: "Staff ID and password are required" }, { status: 400 })
    }

    const user = await signIn(staff_id, password)

    if (!user) {
      return NextResponse.json({ error: "Invalid staff ID or password" }, { status: 401 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
