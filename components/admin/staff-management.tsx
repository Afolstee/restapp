"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, UserX } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Staff {
  staff_id: string
  first_name: string
  last_name: string
  email?: string
  created_at: string
  status: string
}

export default function StaffManagement() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
  })

  const generateStaffId = (firstName: string, lastName: string) => {
    const now = new Date()
    const day = now.getDate().toString().padStart(2, "0")
    const month = (now.getMonth() + 1).toString().padStart(2, "0")
    const firstLetter = firstName.charAt(0).toUpperCase()
    const lastLetter = lastName.charAt(0).toUpperCase()
    return `${day}${month}${firstLetter}${lastLetter}`
  }

  const fetchStaff = async () => {
    try {
      const { data, error } = await createClient().from("staff").select("*").order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching staff:", error)
        return
      }

      setStaff(data || [])
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateStaff = async (e: React.FormEvent) => {
  e.preventDefault()

  const staffId = generateStaffId(formData.first_name, formData.last_name)

  try {
    // Get the current user
    const { data: { user } } = await createClient().auth.getUser()

    const { data, error } = await createClient()
      .from("staff")
      .insert([
        {
          staff_id: staffId,
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email || null,
          created_by: user?.id, // Use the actual user UUID
          status: "active",
        },
      ])
      .select()

    if (error) {
      console.error("Error creating staff:", error)
      return
    }

    setFormData({ first_name: "", last_name: "", email: "" })
    setIsDialogOpen(false)
    fetchStaff()
  } catch (error) {
    console.error("Error:", error)
  }
}

  const handleToggleActive = async (staffId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active"
      const { error } = await createClient().from("staff").update({ status: newStatus }).eq("staff_id", staffId)

      if (error) {
        console.error("Error updating staff:", error)
        return
      }

      fetchStaff()
    } catch (error) {
      console.error("Error:", error)
    }
  }

  useEffect(() => {
    fetchStaff()
  }, [])

  if (isLoading) {
    return <div className="p-6">Loading staff...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Staff Management</h3>
          <p className="text-sm text-muted-foreground">Create and manage staff accounts with auto-generated IDs</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Staff Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Staff Member</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              {formData.first_name && formData.last_name && (
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm font-medium">Generated Staff ID:</p>
                  <p className="text-lg font-mono">{generateStaffId(formData.first_name, formData.last_name)}</p>
                </div>
              )}
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Create Staff Member
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff Members ({staff.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((member) => (
                <TableRow key={member.staff_id}>
                  <TableCell className="font-mono">{member.staff_id}</TableCell>
                  <TableCell>
                    {member.first_name} {member.last_name}
                  </TableCell>
                  <TableCell>{member.email || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={member.status === "active" ? "default" : "secondary"}>
                      {member.status === "active" ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(member.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(member.staff_id, member.status)}
                      >
                        <UserX className="h-4 w-4" />
                        {member.status === "active" ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {staff.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No staff members found. Add your first staff member to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
