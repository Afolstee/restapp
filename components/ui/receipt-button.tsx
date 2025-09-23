"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ReceiptGenerator } from "@/components/receipt/receipt-generator"
import { Receipt } from "lucide-react"

interface ReceiptButtonProps {
  orderId: string
  variant?: "default" | "outline" | "ghost"
  size?: "sm" | "default" | "lg"
}

export function ReceiptButton({ orderId, variant = "outline", size = "sm" }: ReceiptButtonProps) {
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const fetchOrderDetails = async () => {
    if (loading || order) return

    setLoading(true)
    try {
      // Try to get order from local storage first
      const storedOrder = localStorage.getItem(`order-${orderId}`)
      
      if (storedOrder) {
        setOrder(JSON.parse(storedOrder))
      } else {
        // Create mock order data for testing
        const mockOrder = {
          id: orderId,
          table_number: Math.floor(Math.random() * 20) + 1,
          customer_name: "Test Customer",
          subtotal: 50.00,
          tax_amount: 4.38,
          total_amount: 54.38,
          payment_method: "cash",
          created_at: new Date().toISOString(),
          waiter: {
            first_name: "Test",
            last_name: "Waiter"
          },
          order_items: [
            {
              id: "1",
              quantity: 2,
              unit_price: 15.00,
              total_price: 30.00,
              menu_item: {
                name: "Sample Burger",
                description: "Delicious test burger"
              }
            },
            {
              id: "2",
              quantity: 1,
              unit_price: 20.00,
              total_price: 20.00,
              menu_item: {
                name: "Test Fries",
                description: "Crispy test fries"
              }
            }
          ]
        }
        setOrder(mockOrder)
        // Save mock order to local storage for future use
        localStorage.setItem(`order-${orderId}`, JSON.stringify(mockOrder))
      }
    } catch (error) {
      console.error("Error fetching order details:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!order) {
    return (
      <Button variant={variant} size={size} onClick={fetchOrderDetails} disabled={loading} className="w-full sm:w-auto">
        <Receipt className="w-4 h-4 mr-2" />
        {loading ? "Loading..." : "Print Receipt"}
      </Button>
    )
  }

  return (
    <ReceiptGenerator
      order={order}
      trigger={
        <Button variant={variant} size={size} className="w-full sm:w-auto">
          <Receipt className="w-4 h-4 mr-2" />
          Print Receipt
        </Button>
      }
    />
  )
}
