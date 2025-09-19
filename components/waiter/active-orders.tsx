"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ReceiptButton } from "../ui/receipt-button"
import { Clock, User, MapPin } from "lucide-react"

interface Order {
  id: string
  table_number: number
  customer_name?: string
  status: string
  total_amount: number
  created_at: string
  order_items: {
    id: string
    quantity: number
    menu_item: {
      name: string
    }
  }[]
}

export function ActiveOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchActiveOrders()

    // Set up real-time subscription
    const subscription = supabase
      .channel("orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => fetchActiveOrders())
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchActiveOrders = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            id,
            quantity,
            menu_item:menu_items (
              name
            )
          )
        `)
        .eq("waiter_id", user.id)
        .in("status", ["pending", "confirmed", "preparing", "ready"])
        .order("created_at", { ascending: false })

      if (error) throw error

      setOrders(data || [])
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId)

      if (error) throw error

      fetchActiveOrders()
    } catch (error) {
      console.error("Error updating order status:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-400"
      case "confirmed":
        return "bg-blue-500/20 text-blue-400"
      case "preparing":
        return "bg-orange-500/20 text-orange-400"
      case "ready":
        return "bg-green-500/20 text-green-400"
      default:
        return "bg-gray-500/20 text-gray-400"
    }
  }

  const getTimeAgo = (dateString: string) => {
    const now = new Date()
    const orderTime = new Date(dateString)
    const diffInMinutes = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    const hours = Math.floor(diffInMinutes / 60)
    return `${hours}h ${diffInMinutes % 60}m ago`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading orders...</div>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-semibold mb-2">No Active Orders</h3>
        <p className="text-muted-foreground">All orders have been completed or there are no pending orders.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {orders.map((order) => (
        <Card key={order.id} className="bg-card/50 backdrop-blur-sm border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Table {order.table_number}
                </div>
              </CardTitle>
              <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
            </div>
            {order.customer_name && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="w-3 h-3" />
                {order.customer_name}
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              {order.order_items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>
                    {item.quantity}x {item.menu_item.name}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-3 h-3" />
                {getTimeAgo(order.created_at)}
              </div>
              <div className="font-semibold">${order.total_amount.toFixed(2)}</div>
            </div>

            <div className="flex gap-2">
              <ReceiptButton orderId={order.id} size="sm" />
              {order.status === "ready" && (
                <Button
                  onClick={() => updateOrderStatus(order.id, "served")}
                  className="flex-1 bg-primary hover:bg-primary/90"
                  size="sm"
                >
                  Mark as Served
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
