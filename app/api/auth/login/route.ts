import { type NextRequest, NextResponse } from "next/server"
import { signIn } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { firstName, userPassword } = await request.json()

    if (!firstName || !userPassword) {
      return NextResponse.json({ error: "First name and ID are required" }, { status: 400 })
    }

    const user = await signIn(firstName, userPassword)

    if (!user) {
      return NextResponse.json({ error: "Invalid first name or ID" }, { status: 401 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
