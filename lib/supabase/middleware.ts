import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  // Authentication will be handled client-side for now
  return NextResponse.next({
    request,
  })
}
