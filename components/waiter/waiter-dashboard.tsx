"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ProductGrid } from "./product-grid"
import { PaymentSidebar } from "./payment-sidebar"
import { MenuTabs } from "./menu-tabs"
import { ThemeToggle } from "@/components/theme-toggle"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Clock, User, LogOut, Search, Plus, Wine, Menu } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

interface MenuItem {
  id: string
  name: string
  description?: string
  price: number
  type: "food" | "drinks"
  is_available: boolean
  quantity?: number // Stock quantity for drinks only
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
}

export function WaiterDashboard() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [currentOrder, setCurrentOrder] = useState<CurrentOrder>({
    items: [],
  })
  const [activeTab, setActiveTab] = useState<"bar" | "food">("bar")
  const [searchQuery, setSearchQuery] = useState("")
  const [user, setUser] = useState<any>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const supabase = createClient()

  useEffect(() => {
    fetchMenuItems()
    getCurrentUser()
    
    // Listen for localStorage changes (when admin updates menu)
    const handleStorageChange = () => {
      fetchMenuItems()
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // Also poll for changes every 2 seconds to catch same-tab updates
    const pollInterval = setInterval(fetchMenuItems, 2000)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(pollInterval)
    }
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

  const fetchMenuItems = () => {
    try {
      const stored = localStorage.getItem("restaurant-menu-items")
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

  const addToOrder = (menuItem: MenuItem, quantity = 1) => {
    // Check stock availability for drinks
    if (menuItem.quantity !== null && menuItem.quantity !== undefined) {
      const currentInOrder = currentOrder.items
        .filter(item => item.menu_item_id === menuItem.id)
        .reduce((sum, item) => sum + item.quantity, 0)
      
      if (currentInOrder + quantity > menuItem.quantity) {
        toast({
          title: "Insufficient Stock",
          description: `Only ${menuItem.quantity - currentInOrder} ${menuItem.name} remaining in stock.`,
          variant: "destructive",
        })
        return
      }
    }

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
        // Clamp quantity to stock limits for drinks
        let clampedQuantity = quantity
        if (item.menu_item.quantity !== null && item.menu_item.quantity !== undefined) {
          const maxAllowed = Math.min(item.menu_item.quantity, 100)
          if (quantity > maxAllowed) {
            clampedQuantity = maxAllowed
            toast({
              title: "Quantity Limited",
              description: `Maximum ${maxAllowed} ${item.menu_item.name} available.`,
              variant: "default",
            })
          }
        } else {
          // Clamp food items to 100
          if (quantity > 100) {
            clampedQuantity = 100
            toast({
              title: "Quantity Limited",
              description: `Maximum 100 items allowed per order.`,
              variant: "default",
            })
          }
        }
        
        return {
          ...item,
          quantity: clampedQuantity,
          total_price: item.unit_price * clampedQuantity,
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

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    
    // Filter by tab
    const matchesTab = activeTab === "bar" ? item.type === "drinks" : item.type === "food"
    
    return matchesSearch && matchesTab
  })

  const orderTotal = currentOrder.items.reduce((sum, item) => sum + item.total_price, 0)

  return (
    <div className="min-h-screen bg-background grid-pattern">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle>Waiter Menu</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-1">
                  <Button
                    variant={activeTab === "bar" ? "default" : "ghost"}
                    onClick={() => { setActiveTab("bar"); setMobileMenuOpen(false) }}
                    className="w-full justify-start gap-2"
                  >
                    <Wine className="w-4 h-4" />
                    Bar Menu
                  </Button>
                  <Button
                    variant={activeTab === "food" ? "default" : "ghost"}
                    onClick={() => { setActiveTab("food"); setMobileMenuOpen(false) }}
                    className="w-full justify-start gap-2"
                  >
                    <Clock className="w-4 h-4" />
                    Food Menu
                  </Button>
                  
                  <div className="pt-4 border-t border-border mt-4">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirm Sign Out</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to sign out? You will be redirected to the login page.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleSignOut}>Sign Out</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            
            <div className="flex items-center gap-2">
              <Wine className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold">Bar POS</h1>
            </div>
            <Badge variant="secondary" className="bg-primary/20 text-primary">
              Waiter Dashboard
            </Badge>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Sign Out</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to sign out? You will be redirected to the login page.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSignOut}>Sign Out</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          
          {/* Mobile Theme Toggle */}
          <div className="md:hidden">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-73px)]">
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border-b border-border gap-4">
            {/* Desktop Tabs - Hidden on Mobile */}
            <div className="hidden md:block">
              <MenuTabs activeTab={activeTab} onTabChange={setActiveTab} />
            </div>
            
            {/* Mobile Page Title */}
            <div className="md:hidden">
              <h2 className="text-lg font-semibold capitalize">{activeTab} Menu</h2>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative flex-1 sm:flex-none">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search menu items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-4 pb-20 lg:pb-4">
            <ProductGrid items={filteredItems} activeTab={activeTab} onAddToOrder={addToOrder} />
          </div>
        </div>

        {/* Payment Sidebar - Hidden on mobile, visible on large screens */}
        <div className="hidden lg:block">
          <PaymentSidebar
            currentOrder={currentOrder}
            onUpdateOrder={setCurrentOrder}
            onUpdateItem={updateOrderItem}
            onRemoveItem={removeFromOrder}
            orderTotal={orderTotal}
          />
        </div>
        
        {/* Mobile Payment Summary - Only visible on mobile */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 z-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {currentOrder.items.length} item{currentOrder.items.length !== 1 ? 's' : ''}
              </p>
              <p className="font-semibold">₦{orderTotal.toFixed(2)}</p>
            </div>
            <Button 
              size="sm" 
              disabled={currentOrder.items.length === 0}
              className="bg-primary hover:bg-primary/90"
            >
              View Order
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
