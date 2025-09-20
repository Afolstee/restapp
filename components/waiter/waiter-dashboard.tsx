"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { MenuGrid } from "./menu-grid"
import { OrderSidebar } from "./order-sidebar"
import { ActiveOrders } from "./active-orders"
import { ThemeToggle } from "@/components/theme-toggle"
import { Clock, User, LogOut, Search, Plus, Utensils } from "lucide-react"

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  image_url?: string
  is_available: boolean
}

interface OrderItem {
  id: string
  menu_item_id: string
  quantity: number
  unit_price: number
  total_price: number
  special_requests?: string
  menu_item: MenuItem
}

interface CurrentOrder {
  items: OrderItem[]
  table_number: number
  customer_name?: string
  special_instructions?: string
}

export function WaiterDashboard() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [currentOrder, setCurrentOrder] = useState<CurrentOrder>({
    items: [],
    table_number: 1,
  })
  const [activeView, setActiveView] = useState<"menu" | "orders">("menu")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  const supabase = createClient()

  useEffect(() => {
    fetchMenuItems()
    getCurrentUser()
  }, [])

  const getCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single()
      setUser({ ...user, profile })
    }
  }

  const fetchMenuItems = async () => {
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .eq("is_available", true)
      .order("category", { ascending: true })

    if (data) {
      setMenuItems(data)
    }
  }

  const addToOrder = (menuItem: MenuItem, quantity = 1) => {
    const existingItemIndex = currentOrder.items.findIndex((item) => item.menu_item_id === menuItem.id)

    if (existingItemIndex >= 0) {
      const updatedItems = [...currentOrder.items]
      updatedItems[existingItemIndex].quantity += quantity
      updatedItems[existingItemIndex].total_price = updatedItems[existingItemIndex].quantity * menuItem.price

      setCurrentOrder({
        ...currentOrder,
        items: updatedItems,
      })
    } else {
      const newItem: OrderItem = {
        id: `temp-${Date.now()}`,
        menu_item_id: menuItem.id,
        quantity,
        unit_price: menuItem.price,
        total_price: menuItem.price * quantity,
        menu_item: menuItem,
      }

      setCurrentOrder({
        ...currentOrder,
        items: [...currentOrder.items, newItem],
      })
    }
  }

  const removeFromOrder = (itemId: string) => {
    setCurrentOrder({
      ...currentOrder,
      items: currentOrder.items.filter((item) => item.id !== itemId),
    })
  }

  const updateOrderItem = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromOrder(itemId)
      return
    }

    const updatedItems = currentOrder.items.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          quantity,
          total_price: item.unit_price * quantity,
        }
      }
      return item
    })

    setCurrentOrder({
      ...currentOrder,
      items: updatedItems,
    })
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.replace('/auth/login')
    } catch (error) {
      console.error('Error signing out:', error)
      router.replace('/auth/login')
    }
  }

  const categories = ["all", ...new Set(menuItems.map((item) => item.category))]

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const orderTotal = currentOrder.items.reduce((sum, item) => sum + item.total_price, 0)

  return (
    <div className="min-h-screen bg-background grid-pattern">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Utensils className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold">Restaurant POS</h1>
            </div>
            <Badge variant="secondary" className="bg-primary/20 text-primary">
              Waiter Dashboard
            </Badge>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="w-4 h-4" />
              <span>
                {user?.profile?.first_name} {user?.profile?.last_name}
              </span>
            </div>
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Navigation */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex gap-2">
              <Button
                variant={activeView === "menu" ? "default" : "ghost"}
                onClick={() => setActiveView("menu")}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                New Order
              </Button>
              <Button
                variant={activeView === "orders" ? "default" : "ghost"}
                onClick={() => setActiveView("orders")}
                className="gap-2"
              >
                <Clock className="w-4 h-4" />
                Active Orders
              </Button>
            </div>

            {activeView === "menu" && (
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search menu items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 bg-input border border-border rounded-md text-sm"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category === "all" ? "All Categories" : category}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Content Area */}
          <div className="flex-1 p-4">
            {activeView === "menu" ? <MenuGrid items={filteredItems} onAddToOrder={addToOrder} /> : <ActiveOrders />}
          </div>
        </div>

        {/* Order Sidebar */}
        {activeView === "menu" && (
          <OrderSidebar
            currentOrder={currentOrder}
            onUpdateOrder={setCurrentOrder}
            onUpdateItem={updateOrderItem}
            onRemoveItem={removeFromOrder}
            orderTotal={orderTotal}
          />
        )}
      </div>
    </div>
  )
}
