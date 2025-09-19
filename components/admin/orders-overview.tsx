"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ReceiptButton } from "../ui/receipt-button"
import { Clock, User, MapPin, DollarSign } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Order {
  id: string
  table_number: number
  customer_name?: string
  status: string
  total_amount: number
  created_at: string
  waiter: {
    first_name: string
    last_name: string
  }
  order_items: {
    id: string
    quantity: number
    menu_item: {
      name: string
    }
  }[]
}

export function OrdersOverview() {
  const [orders, setOrders] = useState<Order[]>([])
  const [statusFilter, setStatusFilter] = useState("all")
  const [loading, setLoading] = useState(true)

  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchOrders()

    // Set up real-time subscription
    const subscription = supabase
      .channel("admin_orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => fetchOrders())
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchOrders = async () => {
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
            id,
            quantity,
            menu_item:menu_items (
              name
            )
          )
        `)
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

      toast({
        title: "Order Updated",
        description: `Order status changed to ${newStatus}.`,
      })

      fetchOrders()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order status.",
        variant: "destructive",
      })
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
      case "served":
        return "bg-purple-500/20 text-purple-400"
      case "paid":
        return "bg-green-600/20 text-green-300"
      case "cancelled":
        return "bg-red-500/20 text-red-400"
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

  const filteredOrders = orders.filter((order) => statusFilter === "all" || order.status === statusFilter)

  const statusOptions = [
    { value: "all", label: "All Orders" },
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "preparing", label: "Preparing" },
    { value: "ready", label: "Ready" },
    { value: "served", label: "Served" },
    { value: "paid", label: "Paid" },
    { value: "cancelled", label: "Cancelled" },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading orders...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Orders Overview</h2>
          <p className="text-muted-foreground">Monitor and manage all restaurant orders</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-card/50 backdrop-blur-sm border-border">
        <CardHeader>
          <CardTitle>Recent Orders ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order Details</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Waiter</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        <span className="font-medium">Table {order.table_number}</span>
                      </div>
                      {order.customer_name && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="w-3 h-3" />
                          {order.customer_name}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {order.order_items.slice(0, 2).map((item, index) => (
                        <div key={item.id}>
                          {item.quantity}x {item.menu_item.name}
                        </div>
                      ))}
                      {order.order_items.length > 2 && (
                        <div className="text-muted-foreground">+{order.order_items.length - 2} more items</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {order.waiter.first_name} {order.waiter.last_name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {order.total_amount.toFixed(2)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {getTimeAgo(order.created_at)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <ReceiptButton orderId={order.id} />
                      {order.status === "pending" && (
                        <Button size="sm" variant="outline" onClick={() => updateOrderStatus(order.id, "confirmed")}>
                          Confirm
                        </Button>
                      )}
                      {order.status === "confirmed" && (
                        <Button size="sm" variant="outline" onClick={() => updateOrderStatus(order.id, "preparing")}>
                          Prepare
                        </Button>
                      )}
                      {order.status === "preparing" && (
                        <Button size="sm" variant="outline" onClick={() => updateOrderStatus(order.id, "ready")}>
                          Ready
                        </Button>
                      )}
                      {order.status === "served" && (
                        <Button size="sm" variant="outline" onClick={() => updateOrderStatus(order.id, "paid")}>
                          Mark Paid
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
