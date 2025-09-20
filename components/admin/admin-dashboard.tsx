"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import StaffManagement from "./staff-management"
import { MenuManagement } from "./menu-management"
import { OrdersOverview } from "./orders-overview"
import { SalesAnalytics } from "./sales-analytics"
import { AccountCreation } from "./account-creation"
import {
  Users,
  Utensils,
  ClipboardList,
  BarChart3,
  LogOut,
  DollarSign,
  Clock,
  TrendingUp,
  ShoppingBag,
} from "lucide-react"

interface DashboardStats {
  totalOrders: number
  totalRevenue: number
  activeOrders: number
  totalStaff: number
  todayOrders: number
  todayRevenue: number
}

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalRevenue: 0,
    activeOrders: 0,
    totalStaff: 0,
    todayOrders: 0,
    todayRevenue: 0,
  })
  const [user, setUser] = useState<any>(null)

  const supabase = createClient()

  useEffect(() => {
    getCurrentUser()
    fetchDashboardStats()
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

  const fetchDashboardStats = async () => {
    try {
      // Get total orders and revenue
      const { data: allOrders } = await supabase.from("orders").select("total_amount, created_at, status")

      // Get active orders
      const { data: activeOrders } = await supabase
        .from("orders")
        .select("id")
        .in("status", ["pending", "confirmed", "preparing", "ready"])

      // Get total staff
      const { data: staff } = await supabase.from("users").select("id").eq("is_active", true)

      // Calculate today's stats
      const today = new Date().toISOString().split("T")[0]
      const todayOrders = allOrders?.filter((order) => order.created_at.startsWith(today)) || []

      const totalRevenue = allOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0
      const todayRevenue = todayOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0)

      setStats({
        totalOrders: allOrders?.length || 0,
        totalRevenue,
        activeOrders: activeOrders?.length || 0,
        totalStaff: staff?.length || 0,
        todayOrders: todayOrders.length,
        todayRevenue,
      })
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="min-h-screen bg-background grid-pattern">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Utensils className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold">Restaurant POS</h1>
            </div>
            <Badge variant="secondary" className="bg-primary/20 text-primary">
              Admin Dashboard
            </Badge>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>
                Welcome, {user?.profile?.first_name} {user?.profile?.last_name}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-card/50 backdrop-blur-sm">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="menu" className="flex items-center gap-2">
              <Utensils className="w-4 h-4" />
              Menu
            </TabsTrigger>
            <TabsTrigger value="staff" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Staff
            </TabsTrigger>
            <TabsTrigger value="accounts" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Create Account
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-card/50 backdrop-blur-sm border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{stats.todayOrders}</div>
                  <p className="text-xs text-muted-foreground">Total: {stats.totalOrders} orders</p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">${stats.todayRevenue.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">Total: ${stats.totalRevenue.toFixed(2)}</p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{stats.activeOrders}</div>
                  <p className="text-xs text-muted-foreground">Pending & In Progress</p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{stats.totalStaff}</div>
                  <p className="text-xs text-muted-foreground">Total employees</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-card/50 backdrop-blur-sm border-border">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={() => setActiveTab("orders")}
                    className="w-full justify-start bg-primary/10 hover:bg-primary/20 text-primary"
                  >
                    <ClipboardList className="w-4 h-4 mr-2" />
                    View All Orders
                  </Button>
                  <Button onClick={() => setActiveTab("menu")} variant="outline" className="w-full justify-start">
                    <Utensils className="w-4 h-4 mr-2" />
                    Manage Menu Items
                  </Button>
                  <Button onClick={() => setActiveTab("staff")} variant="outline" className="w-full justify-start">
                    <Users className="w-4 h-4 mr-2" />
                    Manage Staff
                  </Button>
                  <Button onClick={() => setActiveTab("accounts")} variant="outline" className="w-full justify-start">
                    <Users className="w-4 h-4 mr-2" />
                    Create Account
                  </Button>
                  <Button onClick={() => setActiveTab("analytics")} variant="outline" className="w-full justify-start">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Analytics
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-border">
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Database Connection</span>
                    <Badge className="bg-green-500/20 text-green-400">Online</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Payment System</span>
                    <Badge className="bg-green-500/20 text-green-400">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Kitchen Display</span>
                    <Badge className="bg-green-500/20 text-green-400">Connected</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Last Backup</span>
                    <span className="text-sm text-muted-foreground">2 hours ago</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="orders">
            <OrdersOverview />
          </TabsContent>

          <TabsContent value="menu">
            <MenuManagement />
          </TabsContent>

          <TabsContent value="staff">
            <StaffManagement />
          </TabsContent>

          <TabsContent value="accounts">
            <AccountCreation />
          </TabsContent>

          <TabsContent value="analytics">
            <SalesAnalytics />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
