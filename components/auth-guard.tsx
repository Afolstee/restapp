"use client"

import type React from "react"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: "admin" | "waitstaff"
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Use our custom authentication API
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include"
        })

        if (!response.ok) {
          router.push("/auth/login")
          return
        }

        const { user } = await response.json()

        if (!user) {
          router.push("/auth/login")
          return
        }

        if (requiredRole) {
          if (user.status !== 'active') {
            router.push("/auth/login")
            return
          }

          // Convert waiter to waitstaff for consistency
          const userRole = user.role === 'waiter' ? 'waitstaff' : user.role

          if (userRole !== requiredRole) {
            // Redirect to appropriate dashboard based on actual role
            if (userRole === "admin") {
              router.push("/admin")
            } else {
              router.push("/waiter")
            }
            return
          }
        }

        setIsAuthorized(true)
      } catch (error) {
        console.error("Auth check failed:", error)
        router.push("/auth/login")
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router, requiredRole])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return <>{children}</>
}
