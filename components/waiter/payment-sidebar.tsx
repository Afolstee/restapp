"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Minus, Plus, Trash2, CreditCard, Banknote } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ReceiptButton } from "@/components/ui/receipt-button"

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  image_url?: string
  is_available: boolean
  quantity?: number | null
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

interface PaymentSidebarProps {
  currentOrder: CurrentOrder
  onUpdateOrder: (order: CurrentOrder) => void
  onUpdateItem: (itemId: string, quantity: number) => void
  onRemoveItem: (itemId: string) => void
  orderTotal: number
}

export function PaymentSidebar({
  currentOrder,
  onUpdateOrder,
  onUpdateItem,
  onRemoveItem,
  orderTotal,
}: PaymentSidebarProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedOrderId, setSubmittedOrderId] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash")
  const { toast } = useToast()
  const supabase = createClient()

  const handleProcessPayment = async () => {
    if (currentOrder.items.length === 0) {
      toast({
        title: "Empty Order",
        description: "Please add items to the order before processing payment.",
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

      // Prepare order items for the database function
      const orderItems = currentOrder.items.map((item) => ({
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        special_requests: item.special_requests,
        name: item.menu_item.name
      }))

      // Call the database function to process order with atomic stock updates
      const { data: result, error } = await supabase.rpc('process_order_with_stock', {
        p_payment_method: paymentMethod,
        p_order_items: orderItems
      })

      if (error) throw error

      if (!result.success) {
        let description = result.error
        if (result.code === 'insufficient_stock' && result.items) {
          description = `Insufficient stock for: ${result.items.join(', ')}`
        }
        toast({
          title: "Order Failed",
          description,
          variant: "destructive",
        })
        return
      }

      // Store the submitted order ID for receipt generation
      setSubmittedOrderId(result.order_id)

      // Clear the current order
      onUpdateOrder({
        items: [],
      })

      toast({
        title: "Payment Processed",
        description: `Payment has been processed successfully via ${paymentMethod}.`,
      })
    } catch (error) {
      console.error("Error processing payment:", error)
      toast({
        title: "Error",
        description: "Failed to process payment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-80 border-l border-border bg-card/30 backdrop-blur-sm flex flex-col h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Order Summary</CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4">
        {/* Order Items */}
        <div className="flex-1 space-y-2">
          <Label className="text-sm font-medium">Items Ordered</Label>
          {currentOrder.items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No items in order</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {currentOrder.items.map((item) => (
                <Card key={item.id} className="p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.menu_item.name}</h4>
                      <p className="text-xs text-muted-foreground">${item.unit_price.toFixed(2)} each</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveItem(item.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
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
                        className="h-7 w-7 p-0"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateItem(item.id, item.quantity + 1)}
                        disabled={
                          item.menu_item.quantity !== null && 
                          item.menu_item.quantity !== undefined && 
                          item.quantity >= Math.min(item.menu_item.quantity, 100)
                        }
                        className="h-7 w-7 p-0"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <Badge variant="secondary">${item.total_price.toFixed(2)}</Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Payment Method Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Payment Method</Label>
          <RadioGroup
            value={paymentMethod}
            onValueChange={(value: "cash" | "card") => setPaymentMethod(value)}
            className="grid grid-cols-2 gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="cash" id="cash" />
              <Label htmlFor="cash" className="flex items-center gap-2 cursor-pointer">
                <Banknote className="w-4 h-4" />
                Cash
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="card" id="card" />
              <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer">
                <CreditCard className="w-4 h-4" />
                Card/Transfer
              </Label>
            </div>
          </RadioGroup>
        </div>

        <Separator />

        {/* Total and Process Payment */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Total:</span>
            <Badge variant="default" className="text-lg py-1 px-3">
              ₦{orderTotal.toFixed(2)}
            </Badge>
          </div>

          <Button
            onClick={handleProcessPayment}
            disabled={currentOrder.items.length === 0 || isSubmitting}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? "Processing..." : "Process Payment"}
          </Button>

          {/* Receipt Generation */}
          {submittedOrderId && (
            <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-md">
              <p className="text-sm text-green-400 mb-2">Payment processed successfully!</p>
              <ReceiptButton orderId={submittedOrderId} variant="outline" />
            </div>
          )}
        </div>
      </CardContent>
    </div>
  )
}