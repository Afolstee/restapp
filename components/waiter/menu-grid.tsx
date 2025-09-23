"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  image_url?: string
  is_available: boolean
}

interface MenuGridProps {
  items: MenuItem[]
  onAddToOrder: (item: MenuItem, quantity?: number) => void
}

export function MenuGrid({ items, onAddToOrder }: MenuGridProps) {
  const groupedItems = items.reduce(
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
    <div className="space-y-8">
      {Object.entries(groupedItems).map(([category, categoryItems]) => (
        <div key={category}>
          <h2 className="text-2xl font-bold mb-4 text-foreground">{category}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {categoryItems.map((item) => (
              <Card
                key={item.id}
                className="group hover:shadow-lg transition-all duration-200 border-border bg-card/50 backdrop-blur-sm"
              >
                <CardContent className="p-4">
                  <div className="flex flex-col h-full">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-lg text-foreground line-clamp-2">{item.name}</h3>
                        <Badge variant="secondary" className="ml-2 bg-primary/20 text-primary">
                          ₦{item.price.toFixed(2)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{item.description}</p>
                    </div>
                    <Button
                      onClick={() => onAddToOrder(item)}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add to Order
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
