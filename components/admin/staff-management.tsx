"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Trash2, User, Mail } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface StaffMember {
  id: string
  username: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  role: string
  hire_date: string
  is_active: boolean
}

export function StaffManagement() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null)
  const [formData, setFormData] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    role: "waiter",
    password: "",
  })

  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchStaff()
  }, [])

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setStaff(data || [])
    } catch (error) {
      console.error("Error fetching staff:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingStaff) {
        // Update existing staff member
        const { error } = await supabase
          .from("users")
          .update({
            username: formData.username,
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email,
            phone: formData.phone,
            role: formData.role,
          })
          .eq("id", editingStaff.id)

        if (error) throw error

        toast({
          title: "Staff Updated",
          description: "Staff member has been updated successfully.",
        })
      } else {
        // Create new staff member
        // First create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        })

        if (authError) throw authError

        if (authData.user) {
          // Then create profile
          const { error: profileError } = await supabase.from("users").insert({
            id: authData.user.id,
            username: formData.username,
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email,
            phone: formData.phone,
            role: formData.role,
            password_hash: "managed_by_auth", // Placeholder since auth handles passwords
          })

          if (profileError) throw profileError
        }

        toast({
          title: "Staff Added",
          description: "New staff member has been added successfully.",
        })
      }

      // Reset form and close dialog
      setFormData({
        username: "",
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        role: "waiter",
        password: "",
      })
      setIsAddDialogOpen(false)
      setEditingStaff(null)
      fetchStaff()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save staff member.",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (staffMember: StaffMember) => {
    setEditingStaff(staffMember)
    setFormData({
      username: staffMember.username,
      first_name: staffMember.first_name,
      last_name: staffMember.last_name,
      email: staffMember.email,
      phone: staffMember.phone || "",
      role: staffMember.role,
      password: "",
    })
    setIsAddDialogOpen(true)
  }

  const toggleStaffStatus = async (staffId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from("users").update({ is_active: !currentStatus }).eq("id", staffId)

      if (error) throw error

      toast({
        title: "Status Updated",
        description: `Staff member has been ${!currentStatus ? "activated" : "deactivated"}.`,
      })

      fetchStaff()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update staff status.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Staff Management</h2>
          <p className="text-muted-foreground">Manage restaurant staff members and their roles</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Staff Member
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingStaff ? "Edit Staff Member" : "Add New Staff Member"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="waiter">Waiter</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {!editingStaff && (
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
              )}
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingStaff ? "Update" : "Add"} Staff Member
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false)
                    setEditingStaff(null)
                    setFormData({
                      username: "",
                      first_name: "",
                      last_name: "",
                      email: "",
                      phone: "",
                      role: "waiter",
                      password: "",
                    })
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-card/50 backdrop-blur-sm border-border">
        <CardHeader>
          <CardTitle>Staff Members</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Hire Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      {member.first_name} {member.last_name}
                    </div>
                  </TableCell>
                  <TableCell>{member.username}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3 h-3 text-muted-foreground" />
                      {member.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={member.role === "admin" ? "default" : "secondary"}>{member.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={member.is_active ? "default" : "secondary"}
                      className={member.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}
                    >
                      {member.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(member.hire_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(member)}>
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleStaffStatus(member.id, member.is_active)}
                        className={
                          member.is_active ? "text-red-500 hover:text-red-600" : "text-green-500 hover:text-green-600"
                        }
                      >
                        {member.is_active ? <Trash2 className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
