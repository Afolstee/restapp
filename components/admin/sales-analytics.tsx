"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { DollarSign, TrendingUp, ShoppingBag, Clock } from "lucide-react"

interface SalesData {
  date: string
  revenue: number
  orders: number
}

interface CategoryData {
  category: string
  revenue: number
  orders: number
  [key: string]: string | number // Index signature for recharts compatibility
}

interface OrderItem {
  quantity: number
  total_price: number
  menu_item: {
    name: string
    category: string
  }
}

interface Order {
  id: string
  created_at: string
  total_amount: number
  status: string
  order_items: OrderItem[]
}

interface Finance {
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
  topSellingItems: Array<{
    name: string
    quantity: number
    revenue: number
  }>
  salesByDay: SalesData[]
  salesByCategory: CategoryData[]
}

export function SalesFinance() {
  const [finance, setFinance] = useState<Finance>({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    topSellingItems: [],
    salesByDay: [],
    salesByCategory: [],
  })
  const [timeRange, setTimeRange] = useState("7days")
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchFinance()
  }, [timeRange])

  const fetchFinance = async () => {
    try {
      const daysBack = timeRange === "7days" ? 7 : timeRange === "30days" ? 30 : 90
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - daysBack)

      // Fetch orders with items
      const { data: orders, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            quantity,
            total_price,
            menu_item:menu_items (
              name,
              category
            )
          )
        `)
        .gte("created_at", startDate.toISOString())
        .eq("status", "paid")

      if (error) throw error

      const typedOrders = orders as Order[] | null

      // Calculate finance
      const totalRevenue = typedOrders?.reduce((sum, order) => sum + order.total_amount, 0) || 0
      const totalOrders = typedOrders?.length || 0
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

      // Sales by day
      const salesByDay: SalesData[] = []
      for (let i = daysBack - 1; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split("T")[0]

        const dayOrders = typedOrders?.filter((order) => order.created_at.startsWith(dateStr)) || []

        salesByDay.push({
          date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          revenue: dayOrders.reduce((sum, order) => sum + order.total_amount, 0),
          orders: dayOrders.length,
        })
      }

      // Sales by category
      const categoryMap = new Map<string, { revenue: number; orders: number }>()
      typedOrders?.forEach((order: Order) => {
        order.order_items.forEach((item: OrderItem) => {
          const category = item.menu_item.category
          const existing = categoryMap.get(category) || { revenue: 0, orders: 0 }
          categoryMap.set(category, {
            revenue: existing.revenue + item.total_price,
            orders: existing.orders + item.quantity,
          })
        })
      })

      const salesByCategory: CategoryData[] = Array.from(categoryMap.entries()).map(([category, data]) => ({
        category,
        revenue: data.revenue,
        orders: data.orders,
      }))

      // Top selling items
      const itemMap = new Map<string, { quantity: number; revenue: number }>()
      typedOrders?.forEach((order: Order) => {
        order.order_items.forEach((item: OrderItem) => {
          const name = item.menu_item.name
          const existing = itemMap.get(name) || { quantity: 0, revenue: 0 }
          itemMap.set(name, {
            quantity: existing.quantity + item.quantity,
            revenue: existing.revenue + item.total_price,
          })
        })
      })

      const topSellingItems = Array.from(itemMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5)

      setFinance({
        totalRevenue,
        totalOrders,
        averageOrderValue,
        topSellingItems,
        salesByDay,
        salesByCategory,
      })
    } catch (error) {
      console.error("Error fetching finance:", error)
    } finally {
      setLoading(false)
    }
  }

  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading finance...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Finance</h2>
          <p className="text-muted-foreground">Track restaurant performance and trends</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">Last 7 Days</SelectItem>
            <SelectItem value="30days">Last 30 Days</SelectItem>
            <SelectItem value="90days">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">₦{finance.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {timeRange === "7days" ? "Last 7 days" : timeRange === "30days" ? "Last 30 days" : "Last 90 days"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{finance.totalOrders}</div>
            <p className="text-xs text-muted-foreground">Completed orders</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">₦{finance.averageOrderValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Per order average</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {(finance.totalOrders / (timeRange === "7days" ? 7 : timeRange === "30days" ? 30 : 90)).toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">Orders per day</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card/50 backdrop-blur-sm border-border">
          <CardHeader>
            <CardTitle>Daily Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={finance.salesByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.6)" />
                <YAxis stroke="rgba(255,255,255,0.6)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(0,0,0,0.8)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="revenue" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border">
          <CardHeader>
            <CardTitle>Sales by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={finance.salesByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percent }) => `${category} ${((percent as number) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="revenue"
                >
                  {finance.salesByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(0,0,0,0.8)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Selling Items */}
      <Card className="bg-card/50 backdrop-blur-sm border-border">
        <CardHeader>
          <CardTitle>Top Selling Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {finance.topSellingItems.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="w-8 h-8 rounded-full flex items-center justify-center">
                    {index + 1}
                  </Badge>
                  <span className="font-medium">{item.name}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">{item.quantity} sold</span>
                  <span className="font-medium">₦{item.revenue.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}