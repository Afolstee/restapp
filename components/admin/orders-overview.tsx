"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Clock, User, Receipt, Printer, X, Calendar, CalendarDays, CalendarRange } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface StoredReceipt {
  id: string
  receiptId: string
  date: string
  timestamp: number
  paymentMethod: "cash" | "card"
  items: Array<{
    id: string
    quantity: number
    unit_price: number
    total_price: number
    menu_item: {
      name: string
    }
  }>
  total: number
  tableNumber?: number
  customerName?: string
  waiterName?: string
}

export function OrdersOverview() {
  const [receipts, setReceipts] = useState<StoredReceipt[]>([])
  const [yearFilter, setYearFilter] = useState<string>("all")
  const [monthFilter, setMonthFilter] = useState<string>("all")
  const [dayFilter, setDayFilter] = useState<string>("all")
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState<StoredReceipt | null>(null)
  
  const { toast } = useToast()

  // Load receipts from localStorage
  useEffect(() => {
    const loadStoredReceipts = () => {
      try {
        const stored = localStorage.getItem("pos_receipts")
        if (stored) {
          const parsedReceipts = JSON.parse(stored)
          setReceipts(parsedReceipts)
        }
      } catch (error) {
        console.error("Error loading stored receipts:", error)
      }
    }

    loadStoredReceipts()
    const interval = setInterval(loadStoredReceipts, 1000)
    return () => clearInterval(interval)
  }, [])

  // Filter helpers
  const getAvailableYears = () => {
    const years = new Set<string>()
    receipts.forEach(receipt => years.add(new Date(receipt.timestamp).getFullYear().toString()))
    return Array.from(years).sort().reverse()
  }

  const getAvailableMonths = () => {
    const months = new Set<string>()
    receipts.forEach(receipt => {
      const date = new Date(receipt.timestamp)
      if (yearFilter === "all" || date.getFullYear().toString() === yearFilter) {
        months.add((date.getMonth() + 1).toString().padStart(2, "0"))
      }
    })
    return Array.from(months).sort().reverse()
  }

  const getAvailableDays = () => {
    const days = new Set<string>()
    receipts.forEach(receipt => {
      const date = new Date(receipt.timestamp)
      const year = date.getFullYear().toString()
      const month = (date.getMonth() + 1).toString().padStart(2, "0")
      if ((yearFilter === "all" || year === yearFilter) &&
          (monthFilter === "all" || month === monthFilter)) {
        days.add(date.getDate().toString().padStart(2, "0"))
      }
    })
    return Array.from(days).sort().reverse()
  }

  // Apply filters
  const filteredReceipts = receipts.filter(receipt => {
    const date = new Date(receipt.timestamp)
    const year = date.getFullYear().toString()
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const day = date.getDate().toString().padStart(2, "0")
    return (yearFilter === "all" || year === yearFilter) &&
           (monthFilter === "all" || month === monthFilter) &&
           (dayFilter === "all" || day === dayFilter)
  })

  // Orders for table
  const orders = filteredReceipts.map(receipt => ({
    id: receipt.id,
    table_number: receipt.tableNumber || 1,
    customer_name: receipt.customerName || undefined,
    total_amount: receipt.total,
    created_at: new Date(receipt.timestamp).toISOString(),
    payment_method: receipt.paymentMethod,
    waiter: {
      first_name: receipt.waiterName?.split(" ")[0] || "Current",
      last_name: receipt.waiterName?.split(" ")[1] || "User"
    },
    order_items: receipt.items.map(item => ({
      id: item.id,
      quantity: item.quantity,
      menu_item: { name: item.menu_item.name }
    })),
    receipt_id: receipt.receiptId,
    original_receipt: receipt
  }))

  const getTimeAgo = (dateString: string) => {
    const now = new Date()
    const orderTime = new Date(dateString)
    const diffInMinutes = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60))
    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    const hours = Math.floor(diffInMinutes / 60)
    if (hours < 24) return `${hours}h ${diffInMinutes % 60}m ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  const handleViewReceipt = (orderId: string) => {
    const receipt = receipts.find(r => r.id === orderId)
    if (receipt) {
      setSelectedReceipt(receipt)
      setShowReceiptModal(true)
    }
  }

  const getMonthName = (monthNumber: string) => {
    const months = [
      "January","February","March","April","May","June",
      "July","August","September","October","November","December"
    ]
    return months[parseInt(monthNumber) - 1]
  }

  // Reset filters
  const handleYearFilterChange = (value: string) => {
    setYearFilter(value)
    setMonthFilter("all")
    setDayFilter("all")
  }
  const handleMonthFilterChange = (value: string) => {
    setMonthFilter(value)
    setDayFilter("all")
  }

  return (
    <div className="space-y-6">
      {/* Header + Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Orders Overview</h2>
          <p className="text-muted-foreground">Monitor and manage all processed orders</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={yearFilter} onValueChange={handleYearFilterChange}>
            <SelectTrigger className="w-32">
              <CalendarRange className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {getAvailableYears().map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={monthFilter} onValueChange={handleMonthFilterChange}>
            <SelectTrigger className="w-36">
              <CalendarDays className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Months</SelectItem>
              {getAvailableMonths().map(month => (
                <SelectItem key={month} value={month}>{getMonthName(month)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={dayFilter} onValueChange={setDayFilter}>
            <SelectTrigger className="w-32">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Day" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Days</SelectItem>
              {getAvailableDays().map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Orders Table */}
      <Card className="bg-card/50 backdrop-blur-sm border-border">
        <CardHeader>
          <CardTitle>
            Recent Orders ({filteredReceipts.length})
            {yearFilter !== "all" && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                - {yearFilter}{monthFilter !== "all" && ` ${getMonthName(monthFilter)}`}{dayFilter !== "all" && ` ${dayFilter}`}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {receipts.length === 0 
                ? "No processed orders yet. Process some payments to see them here."
                : "No orders found for the selected date filters."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order Details</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Waiter</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map(order => (
                  <TableRow
                    key={order.id}
                    onClick={() => handleViewReceipt(order.id)}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-s">{order.receipt_id}</div>
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
                        {order.order_items.slice(0, 2).map(item => (
                          <div key={item.id}>{item.quantity}x {item.menu_item.name}</div>
                        ))}
                        {order.order_items.length > 2 && (
                          <div className="text-muted-foreground">+{order.order_items.length - 2} more items</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{order.waiter.first_name} {order.waiter.last_name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        ₦{order.total_amount.toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="w-3 h-3" /> {getTimeAgo(order.created_at)}
                      </div>
                    </TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleViewReceipt(order.id)}
                        className="flex items-center gap-1"
                      >
                        <Receipt className="w-3 h-3" /> View Receipt
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Receipt Modal */}
      <Dialog open={showReceiptModal} onOpenChange={setShowReceiptModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Receipt Details</DialogTitle>
          </DialogHeader>
          {selectedReceipt && (
            <div className="space-y-4">
              <div className="bg-white text-black font-mono text-xs border rounded p-4">
                <div className="text-center border-b-2 border-black pb-2 mb-3">
                  <div className="font-bold text-sm">Bar POS</div>
                  <div className="text-xs">26, Mock Street, Nigeria</div>
                </div>
                <div className="mb-3 text-xs">
                  <div><strong>Receipt ID:</strong> {selectedReceipt.receiptId}</div>
                  <div><strong>Date:</strong> {selectedReceipt.date}</div>
                  <div><strong>Payment Method:</strong> {selectedReceipt.paymentMethod.toUpperCase()}</div>
                </div>
                <div className="mb-3">
                  {selectedReceipt.items.map(item => (
                    <div key={item.id} className="flex justify-between mb-1">
                      <div className="flex-1 mr-2">{item.menu_item.name}</div>
                      <div className="mr-2">{item.quantity}x</div>
                      <div className="text-right">₦{item.total_price.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-black pt-2">
                  <div className="flex justify-between font-bold text-sm">
                    <span>TOTAL:</span>
                    <span>₦{selectedReceipt.total.toFixed(2)}</span>
                  </div>
                </div>
                <div className="text-center mt-4 pt-3 border-t border-black">
                  <div>Thanks for your patronage. We hope to see you again.</div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    const receiptHTML = `
                      <html><head><title>Receipt</title></head>
                      <body>${document.querySelector(".bg-white")?.outerHTML}</body></html>
                    `
                    const printWindow = window.open("", "_blank")
                    if (printWindow) {
                      printWindow.document.write(receiptHTML)
                      printWindow.document.close()
                      printWindow.focus()
                      printWindow.print()
                      printWindow.close()
                    }
                    setShowReceiptModal(false)
                  }}
                  className="flex-1"
                >
                  <Printer className="w-4 h-4 mr-2" /> Print
                </Button>
                <Button onClick={() => setShowReceiptModal(false)} variant="outline" className="flex-1">
                  <X className="w-4 h-4 mr-2" /> Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
