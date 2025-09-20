"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChefHat, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"

export default function SetupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const createAdminUser = async () => {
    setIsLoading(true)
    setError(null)

    try {
      console.log("Creating admin staff...")

      const response = await fetch("/api/auth/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "admin@restaurant.com",
          password: "0919RW",
          first_name: "Admin",
          last_name: "User",
          staff_id: "2009AU"
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to create admin staff")
      }

      console.log("Admin staff created successfully:", result)

      setIsComplete(true)

      setTimeout(() => {
        router.push("/auth/login")
      }, 3000)
    } catch (error: any) {
      console.log("Setup error:", error)
      setError(error.message || "Failed to create admin staff")
    } finally {
      setIsLoading(false)
    }
  }

  if (isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-6">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">Setup Complete!</CardTitle>
            <CardDescription className="text-gray-600">
              Admin staff created! You can now log in with your Staff ID.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 p-6">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center pb-8">
          <div className="mx-auto mb-4 w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center">
            <ChefHat className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">Restaurant POS Setup</CardTitle>
          <CardDescription className="text-gray-600">Create the initial admin staff member to get started</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="font-medium text-blue-900 mb-2">Admin Staff Details:</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p>
                <strong>Email:</strong> admin@restaurant.com
              </p>
              <p>
                <strong>Staff ID:</strong> 2009ADMIN
              </p>
              <p>
                <strong>Password:</strong> 0919RW
              </p>
              <p>
                <strong>Name:</strong> Admin User
              </p>
            </div>
          </div>

          {error && <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">{error}</div>}

          <Button
            onClick={createAdminUser}
            disabled={isLoading}
            className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-medium"
          >
            {isLoading ? "Creating Admin Staff..." : "Create Admin Staff"}
          </Button>

          <p className="text-xs text-gray-500 text-center">This will create the admin staff member in the database.</p>
        </CardContent>
      </Card>
    </div>
  )
}
