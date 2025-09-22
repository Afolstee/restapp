"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ReceiptButton } from "@/components/ui/receipt-button" // Assuming ReceiptButton is imported from this path

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

interface OrderSidebarProps {
  currentOrder: CurrentOrder
  onUpdateOrder: (order: CurrentOrder) => void
  onUpdateItem: (itemId: string, quantity: number) => void
  onRemoveItem: (itemId: string) => void
  orderTotal: number
}

export function OrderSidebar({
  currentOrder,
  onUpdateOrder,
  onUpdateItem,
  onRemoveItem,
  orderTotal,
}: OrderSidebarProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedOrderId, setSubmittedOrderId] = useState<string | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  const handleSubmitOrder = async () => {
    if (currentOrder.items.length === 0) {
      toast({
        title: "Empty Order",
        description: "Please add items to the order before submitting.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("User not authenticated")
      }

      // Create the order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          waiter_id: user.id,
          table_number: currentOrder.table_number,
          customer_name: currentOrder.customer_name,
          special_instructions: currentOrder.special_instructions,
          status: "pending",
          order_type: "dine-in",
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Create order items
      const orderItems = currentOrder.items.map((item) => ({
        order_id: order.id,
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        special_requests: item.special_requests,
      }))

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

      if (itemsError) throw itemsError

      // Store the submitted order ID for receipt generation
      setSubmittedOrderId(order.id)

      // Clear the current order
      onUpdateOrder({
        items: [],
        table_number: currentOrder.table_number + 1,
      })

      toast({
        title: "Order Submitted",
        description: `Order has been submitted successfully.`,
      })
    } catch (error) {
      console.error("Error submitting order:", error)
      toast({
        title: "Error",
        description: "Failed to submit order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const taxAmount = orderTotal * 0.0875 // 8.75% tax
  const finalTotal = orderTotal + taxAmount

  return (
    <div className="w-96 border-l border-border bg-card/30 backdrop-blur-sm flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          Current Order
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4">
        {/* Order Details */}
        <div className="space-y-3">
          <div>
            <Label htmlFor="table-number">Table Number</Label>
            <Input
              id="table-number"
              type="number"
              min="1"
              value={currentOrder.table_number}
              onChange={(e) =>
                onUpdateOrder({
                  ...currentOrder,
                  table_number: Number.parseInt(e.target.value) || 1,
                })
              }
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="customer-name">Customer Name (Optional)</Label>
            <Input
              id="customer-name"
              value={currentOrder.customer_name || ""}
              onChange={(e) =>
                onUpdateOrder({
                  ...currentOrder,
                  customer_name: e.target.value,
                })
              }
              className="mt-1"
              placeholder="Enter customer name"
            />
          </div>
        </div>

        <Separator />

        {/* Order Items */}
        <div className="flex-1 overflow-y-auto space-y-3">
          {currentOrder.items.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No items in order</p>
              <p className="text-sm">Add items from the menu</p>
            </div>
          ) : (
            currentOrder.items.map((item) => (
              <Card key={item.id} className="bg-background/50">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm">{item.menu_item.name}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveItem(item.id)}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateItem(item.id, item.quantity - 1)}
                        className="h-6 w-6 p-0"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateItem(item.id, item.quantity + 1)}
                        className="h-6 w-6 p-0"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <Badge variant="secondary">₦{item.total_price.toFixed(2)}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Special Instructions */}
        <div>
          <Label htmlFor="special-instructions">Special Instructions</Label>
          <Textarea
            id="special-instructions"
            value={currentOrder.special_instructions || ""}
            onChange={(e) =>
              onUpdateOrder({
                ...currentOrder,
                special_instructions: e.target.value,
              })
            }
            className="mt-1 resize-none"
            rows={2}
            placeholder="Any special requests..."
          />
        </div>

        <Separator />

        {/* Order Summary */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal:</span>
            <span>₦{orderTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Tax (8.75%):</span>
            <span>₦{taxAmount.toFixed(2)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-semibold">
            <span>Total:</span>
            <span>₦{finalTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmitOrder}
          disabled={isSubmitting || currentOrder.items.length === 0}
          className="w-full bg-primary hover:bg-primary/90"
        >
          {isSubmitting ? "Submitting..." : "Submit Order"}
        </Button>

        {/* Receipt Generation */}
        {submittedOrderId && (
          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-md">
            <p className="text-sm text-green-400 mb-2">Order submitted successfully!</p>
            <ReceiptButton orderId={submittedOrderId} variant="outline" />
          </div>
        )}
      </CardContent>
    </div>
  )
}
