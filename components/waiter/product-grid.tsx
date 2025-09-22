"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, AlertTriangle } from "lucide-react"

interface MenuItem {
  id: string
  name: string
  description?: string
  price: number
  type: "food" | "drinks"
  is_available: boolean
  quantity?: number // Only for drinks
}

interface ProductGridProps {
  items: MenuItem[]
  activeTab: "bar" | "food"
  onAddToOrder: (item: MenuItem, quantity?: number) => void
}

export function ProductGrid({ items, activeTab, onAddToOrder }: ProductGridProps) {
  // Define bar/drink categories more explicitly
  const barCategories = new Set([
    'beverages', 'drinks', 'bar', 'wine', 'beer', 'cocktails', 
    'spirits', 'soft drinks', 'juices', 'coffee', 'tea'
  ])

  // Filter items based on active tab using the type field from admin dashboard
  const filteredItems = items.filter(item => {
    return activeTab === "bar" ? item.type === "drinks" : item.type === "food"
  })

  // Check if drink is low stock (less than 10 units)
  const isLowStock = (item: MenuItem) => {
    return activeTab === "bar" && item.quantity !== null && item.quantity !== undefined && item.quantity < 10
  }

  // Check if item is clickable
  const isClickable = (item: MenuItem) => {
    if (activeTab === "food") {
      return item.is_available
    } else {
      return item.is_available && item.quantity !== null && item.quantity !== undefined && item.quantity > 0
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {filteredItems.map((item) => {
        const lowStock = isLowStock(item)
        const clickable = isClickable(item)
        
        return (
          <Card
            key={item.id}
            className={`group transition-all duration-200 border-border bg-card/50 backdrop-blur-sm ${
              clickable ? 'hover:shadow-lg cursor-pointer' : 'opacity-50 cursor-not-allowed'
            } ${lowStock ? 'border-yellow-500/50' : ''}`}
          >
            <CardContent className="p-4">
              <div className="flex flex-col h-full">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg text-foreground line-clamp-2">{item.name}</h3>
                    <Badge variant="secondary" className="ml-2 bg-primary/20 text-primary">
                      ${item.price.toFixed(2)}
                    </Badge>
                  </div>
                  
                  {/* Stock information for drinks */}
                  {activeTab === "bar" && item.quantity !== null && item.quantity !== undefined && (
                    <div className="flex items-center gap-2 mb-2">
                      <Badge 
                        variant={lowStock ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        {lowStock && <AlertTriangle className="w-3 h-3 mr-1" />}
                        Stock: {item.quantity}
                      </Badge>
                      {lowStock && (
                        <span className="text-xs text-yellow-500">Low Stock!</span>
                      )}
                    </div>
                  )}
                  
                  {/* Only show description if it exists */}
                  {item.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{item.description}</p>
                  )}
                </div>
                
                <Button
                  onClick={() => clickable && onAddToOrder(item)}
                  disabled={!clickable}
                  className={`w-full ${
                    clickable 
                      ? 'bg-primary hover:bg-primary/90 text-primary-foreground' 
                      : 'bg-gray-500 cursor-not-allowed'
                  }`}
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {!item.is_available ? 'Not Available' : 
                   (activeTab === "bar" && (item.quantity === 0 || item.quantity === null)) ? 'Out of Stock' : 
                   'Add to Order'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
      
      {filteredItems.length === 0 && (
        <div className="col-span-full text-center py-8 text-muted-foreground">
          No items found in the {activeTab === "bar" ? "bar" : "food"} menu.
        </div>
      )}
    </div>
  )
}