import { createClient } from "@/lib/supabase/server"

export async function getCurrentUser() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: userProfile } = await supabase.from("users").select("*").eq("id", user.id).single()

  return {
    ...user,
    profile: userProfile,
  }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
}
