"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Plus, Edit, Trash2, Utensils } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  image_url?: string
  is_available: boolean
  preparation_time: number
  ingredients?: string[]
  allergens?: string[]
}

export function MenuManagement() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    preparation_time: "15",
    is_available: true,
  })

  const supabase = createClient()
  const { toast } = useToast()

  const categories = ["Pizza", "Salads", "Main Course", "Desserts", "Beverages", "Appetizers"]

  useEffect(() => {
    fetchMenuItems()
  }, [])

  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase.from("menu_items").select("*").order("category", { ascending: true })

      if (error) throw error
      setMenuItems(data || [])
    } catch (error) {
      console.error("Error fetching menu items:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const itemData = {
        name: formData.name,
        description: formData.description,
        price: Number.parseFloat(formData.price),
        category: formData.category,
        preparation_time: Number.parseInt(formData.preparation_time),
        is_available: formData.is_available,
      }

      if (editingItem) {
        const { error } = await supabase.from("menu_items").update(itemData).eq("id", editingItem.id)

        if (error) throw error

        toast({
          title: "Menu Item Updated",
          description: "Menu item has been updated successfully.",
        })
      } else {
        const { error } = await supabase.from("menu_items").insert(itemData)

        if (error) throw error

        toast({
          title: "Menu Item Added",
          description: "New menu item has been added successfully.",
        })
      }

      setFormData({
        name: "",
        description: "",
        price: "",
        category: "",
        preparation_time: "15",
        is_available: true,
      })
      setIsAddDialogOpen(false)
      setEditingItem(null)
      fetchMenuItems()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save menu item.",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      category: item.category,
      preparation_time: item.preparation_time.toString(),
      is_available: item.is_available,
    })
    setIsAddDialogOpen(true)
  }

  const handleDelete = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this menu item?")) return

    try {
      const { error } = await supabase.from("menu_items").delete().eq("id", itemId)

      if (error) throw error

      toast({
        title: "Menu Item Deleted",
        description: "Menu item has been deleted successfully.",
      })

      fetchMenuItems()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete menu item.",
        variant: "destructive",
      })
    }
  }

  const toggleAvailability = async (itemId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from("menu_items").update({ is_available: !currentStatus }).eq("id", itemId)

      if (error) throw error

      toast({
        title: "Availability Updated",
        description: `Menu item is now ${!currentStatus ? "available" : "unavailable"}.`,
      })

      fetchMenuItems()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update availability.",
        variant: "destructive",
      })
    }
  }

  const groupedItems = menuItems.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = []
      }
      acc[item.category].push(item)
      return acc
    },
    {} as Record<string, MenuItem[]>,
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Menu Management</h2>
          <p className="text-muted-foreground">Manage restaurant menu items and categories</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Menu Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit Menu Item" : "Add New Menu Item"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Item Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="prep_time">Prep Time (min)</Label>
                  <Input
                    id="prep_time"
                    type="number"
                    min="1"
                    value={formData.preparation_time}
                    onChange={(e) => setFormData({ ...formData, preparation_time: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="available"
                  checked={formData.is_available}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
                />
                <Label htmlFor="available">Available</Label>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingItem ? "Update" : "Add"} Item
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false)
                    setEditingItem(null)
                    setFormData({
                      name: "",
                      description: "",
                      price: "",
                      category: "",
                      preparation_time: "15",
                      is_available: true,
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

      <div className="space-y-6">
        {Object.entries(groupedItems).map(([category, items]) => (
          <Card key={category} className="bg-card/50 backdrop-blur-sm border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="w-5 h-5" />
                {category}
                <Badge variant="secondary">{items.length} items</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item) => (
                  <Card key={item.id} className="bg-background/50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold">{item.name}</h4>
                        <Badge
                          variant={item.is_available ? "default" : "secondary"}
                          className={
                            item.is_available ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                          }
                        >
                          {item.is_available ? "Available" : "Unavailable"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{item.description}</p>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-primary">${item.price.toFixed(2)}</span>
                        <span className="text-xs text-muted-foreground">{item.preparation_time} min</span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleAvailability(item.id, item.is_available)}
                          className={
                            item.is_available
                              ? "text-red-500 hover:text-red-600"
                              : "text-green-500 hover:text-green-600"
                          }
                        >
                          {item.is_available ? "Disable" : "Enable"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
