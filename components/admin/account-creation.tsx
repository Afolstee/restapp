"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UserPlus, Loader2, CheckCircle, AlertCircle } from "lucide-react"

interface CreateAccountForm {
  email: string
  username: string
  password: string
  firstName: string
  lastName: string
  role: "admin" | "waiter"
}

export function AccountCreation() {
  const [form, setForm] = useState<CreateAccountForm>({
    email: "",
    username: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "waiter",
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            username: form.username,
            first_name: form.firstName,
            last_name: form.lastName,
            role: form.role,
          },
        },
      })

      if (authError) throw authError

      if (authData.user) {
        // Create user record in our users table
        const { error: dbError } = await supabase.from("users").insert({
          id: authData.user.id,
          username: form.username,
          email: form.email,
          first_name: form.firstName,
          last_name: form.lastName,
          role: form.role,
          is_active: true,
        })

        if (dbError) throw dbError

        setMessage({
          type: "success",
          text: `Account created successfully for ${form.firstName} ${form.lastName}`,
        })

        // Reset form
        setForm({
          email: "",
          username: "",
          password: "",
          firstName: "",
          lastName: "",
          role: "waiter",
        })
      }
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "Failed to create account",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof CreateAccountForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <UserPlus className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold">Create Staff Account</h2>
      </div>

      <Card className="bg-card/50 backdrop-blur-sm border-border">
        <CardHeader>
          <CardTitle>New Staff Member</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={form.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  required
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={form.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  required
                  className="bg-background/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={form.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                required
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                required
                minLength={6}
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={form.role} onValueChange={(value: "admin" | "waiter") => handleInputChange("role", value)}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="waiter">Waiter</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {message && (
              <Alert
                className={
                  message.type === "success" ? "border-green-500/50 bg-green-500/10" : "border-red-500/50 bg-red-500/10"
                }
              >
                {message.type === "success" ? (
                  <CheckCircle className="h-4 w-4 text-green-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-400" />
                )}
                <AlertDescription className={message.type === "success" ? "text-green-400" : "text-red-400"}>
                  {message.text}
                </AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create Account
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
