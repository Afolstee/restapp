"use client"

import type React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ChefHat } from "lucide-react"

export default function LoginPage() {
  const [firstName, setFirstName] = useState("")
  const [userPassword, setUserPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      console.log("[v0] Attempting login with firstName:", firstName)

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ firstName, userPassword }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Invalid first name or ID")
      }

      console.log("[v0] Login successful:", result)

      if (result.user.role === "admin") {
        router.push("/admin")
      } else {
        router.push("/waiter")
      }
    } catch (error: unknown) {
      console.log("[v0] Login error:", error)
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 p-6">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto mb-4 w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center">
              <ChefHat className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">Restaurant POS</CardTitle>
            <CardDescription className="text-gray-600">Sign in to access your dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="Enter your first name"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="userPassword" className="text-sm font-medium text-gray-700">
                  ID (Password)
                </Label>
                <Input
                  id="userPassword"
                  type="password"
                  placeholder="Enter your generated ID"
                  required
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  className="h-12"
                />
              </div>
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">{error}</div>
              )}
              <Button
                type="submit"
                className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-medium"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800 font-medium">Demo Credentials:</p>
              <p className="text-xs text-blue-600">First Name: Restwebbapp</p>
              <p className="text-xs text-blue-600">ID: 0919RW</p>
            </div>

            <div className="mt-6 text-center text-sm space-y-2">
              <div className="text-gray-600">
                Accounts can only be created by admin users in the admin dashboard.
              </div>
              <div>
                First time setup?{" "}
                <Link href="/setup" className="text-blue-500 hover:text-blue-600 font-medium hover:underline">
                  Create admin user
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
