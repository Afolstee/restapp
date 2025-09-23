import { redirect } from "next/navigation"
import { getUser } from "@/lib/auth"

export default async function HomePage() {
  const user = await getUser()

  if (user) {
    if (user.role === "admin") {
      redirect("/admin")
    } else {
      redirect("/waiter")
    }
  }

  redirect("/auth/login")
}
