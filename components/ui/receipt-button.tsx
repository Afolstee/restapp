"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
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
  const supabase = createClient()

  const fetchOrderDetails = async () => {
    if (loading || order) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          waiter:users!orders_waiter_id_fkey (
            first_name,
            last_name
          ),
          order_items (
            *,
            menu_item:menu_items (
              name,
              description
            )
          )
        `)
        .eq("id", orderId)
        .single()

      if (error) throw error
      setOrder(data)
    } catch (error) {
      console.error("Error fetching order details:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!order) {
    return (
      <Button variant={variant} size={size} onClick={fetchOrderDetails} disabled={loading}>
        <Receipt className="w-4 h-4 mr-2" />
        {loading ? "Loading..." : "Receipt"}
      </Button>
    )
  }

  return (
    <ReceiptGenerator
      order={order}
      trigger={
        <Button variant={variant} size={size}>
          <Receipt className="w-4 h-4 mr-2" />
          Receipt
        </Button>
      }
    />
  )
}
