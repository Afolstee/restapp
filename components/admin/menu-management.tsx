"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Edit, Trash2, Utensils, Coffee } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface MenuItem {
  id: string
  name: string
  price: number
  type: "food" | "drinks"
  is_available: boolean
  quantity?: number // For drinks
}

export function MenuManagement() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [activeTab, setActiveTab] = useState<"food" | "drinks">("food")
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    quantity: "",
    is_available: true,
  })

  const { toast } = useToast()

  // Local storage key for menu items
  const MENU_ITEMS_KEY = "restaurant-menu-items"

  // Generate unique ID for new items
  const generateId = () => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9)
  }

  useEffect(() => {
    fetchMenuItems()
  }, [])

  const fetchMenuItems = () => {
    try {
      const stored = localStorage.getItem(MENU_ITEMS_KEY)
      if (stored) {
        const items = JSON.parse(stored)
        // Sort by type for consistency
        const sortedItems = items.sort((a: MenuItem, b: MenuItem) => a.type.localeCompare(b.type))
        setMenuItems(sortedItems)
      } else {
        setMenuItems([])
      }
    } catch (error) {
      console.error("Error fetching menu items from localStorage:", error)
      setMenuItems([])
    }
  }

  const saveMenuItems = (items: MenuItem[]) => {
    try {
      // Sort by type for consistency
      const sortedItems = items.sort((a, b) => a.type.localeCompare(b.type))
      localStorage.setItem(MENU_ITEMS_KEY, JSON.stringify(sortedItems))
    } catch (error) {
      console.error("Error saving menu items to localStorage:", error)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const itemData: MenuItem = {
        id: editingItem ? editingItem.id : generateId(),
        name: formData.name,
        price: Number.parseFloat(formData.price),
        type: activeTab,
        is_available: formData.is_available,
        ...(activeTab === "drinks" && { quantity: Number.parseInt(formData.quantity) || 0 })
      }

      let updatedItems: MenuItem[]

      if (editingItem) {
        // Update existing item
        updatedItems = menuItems.map(item => 
          item.id === editingItem.id ? itemData : item
        )

        toast({
          title: "Menu Item Updated",
          description: "Menu item has been updated successfully.",
        })
      } else {
        // Add new item
        updatedItems = [...menuItems, itemData]

        toast({
          title: "Menu Item Added",
          description: `New ${activeTab === "food" ? "food" : "drink"} item has been added successfully.`,
        })
      }

      // Save to localStorage and update state with sorted items
      saveMenuItems(updatedItems)
      const sortedItems = updatedItems.sort((a, b) => a.type.localeCompare(b.type))
      setMenuItems(sortedItems)

      // Reset form
      setFormData({
        name: "",
        price: "",
        quantity: "",
        is_available: true,
      })
      setIsAddDialogOpen(false)
      setEditingItem(null)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to save menu item.",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item)
    setActiveTab(item.type) // Switch to the correct tab
    setFormData({
      name: item.name,
      price: item.price.toString(),
      quantity: item.quantity?.toString() || "",
      is_available: item.is_available,
    })
    setIsAddDialogOpen(true)
  }

  const handleDelete = (itemId: string) => {
    if (!confirm("Are you sure you want to delete this menu item?")) return

    try {
      const updatedItems = menuItems.filter(item => item.id !== itemId)
      
      saveMenuItems(updatedItems)
      const sortedItems = updatedItems.sort((a, b) => a.type.localeCompare(b.type))
      setMenuItems(sortedItems)

      toast({
        title: "Menu Item Deleted",
        description: "Menu item has been deleted successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete menu item.",
        variant: "destructive",
      })
    }
  }

  const toggleAvailability = (itemId: string, currentStatus: boolean) => {
    try {
      const updatedItems = menuItems.map(item => 
        item.id === itemId ? { ...item, is_available: !currentStatus } : item
      )
      
      saveMenuItems(updatedItems)
      const sortedItems = updatedItems.sort((a, b) => a.type.localeCompare(b.type))
      setMenuItems(sortedItems)

      toast({
        title: "Availability Updated",
        description: `Menu item is now ${!currentStatus ? "available" : "unavailable"}.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update availability.",
        variant: "destructive",
      })
    }
  }

  // Filter items by type for the active tab
  const filteredItems = menuItems.filter(item => item.type === activeTab)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Menu Management</h2>
          <p className="text-muted-foreground">Manage food and drink items</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "food" | "drinks")} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="food" className="flex items-center gap-2">
            <Utensils className="w-4 h-4" />
            Food
          </TabsTrigger>
          <TabsTrigger value="drinks" className="flex items-center gap-2">
            <Coffee className="w-4 h-4" />
            Drinks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="food" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Food Items</h3>
            <Dialog open={isAddDialogOpen && activeTab === "food"} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90" onClick={() => setActiveTab("food")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Food Item
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingItem ? "Edit Food Item" : "Add New Food Item"}</DialogTitle>
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
                    <Label htmlFor="price">Price (₦)</Label>
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
                      {editingItem ? "Update" : "Add"} Food Item
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsAddDialogOpen(false)
                        setEditingItem(null)
                        setFormData({
                          name: "",
                          price: "",
                          quantity: "",
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
        </TabsContent>

        <TabsContent value="drinks" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Drink Items</h3>
            <Dialog open={isAddDialogOpen && activeTab === "drinks"} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90" onClick={() => setActiveTab("drinks")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Drink Item
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingItem ? "Edit Drink Item" : "Add New Drink Item"}</DialogTitle>
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price">Price (₦)</Label>
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
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="0"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        required
                      />
                    </div>
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
                      {editingItem ? "Update" : "Add"} Drink Item
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsAddDialogOpen(false)
                        setEditingItem(null)
                        setFormData({
                          name: "",
                          price: "",
                          quantity: "",
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
        </TabsContent>
      </Tabs>

      {/* Display items for current tab */}
      <Card className="bg-card/50 backdrop-blur-sm border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {activeTab === "food" ? <Utensils className="w-5 h-5" /> : <Coffee className="w-5 h-5" />}
            {activeTab === "food" ? "Food Items" : "Drink Items"}
            <Badge variant="secondary">{filteredItems.length} items</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No {activeTab} items yet. Add one using the button above.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => (
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
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-primary">₦{item.price.toFixed(2)}</span>
                      {item.type === "drinks" && item.quantity && (
                        <span className="text-xs text-muted-foreground">Qty: {item.quantity}</span>
                      )}
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}
