"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Minus, Plus, Trash2, CreditCard, Banknote, Printer, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface MenuItem {
  id: string
  name: string
  description?: string
  price: number
  type: "food" | "drinks"
  is_available: boolean
  quantity?: number
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
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash")
  const [receiptData, setReceiptData] = useState<any>(null)
  const { toast } = useToast()

  // Generate a simple receipt ID
  const generateReceiptId = () => {
    const timestamp = Date.now().toString().slice(-8)
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0")
    return `RCP-${timestamp}-${random}`
  }

  // Save receipt to localStorage
  const saveReceiptToStorage = (receipt: any) => {
    try {
      const existingReceipts = localStorage.getItem("pos_receipts")
      const receipts = existingReceipts ? JSON.parse(existingReceipts) : []

      const newReceipt = {
        id: receipt.id,
        receiptId: receipt.receiptId,
        date: receipt.date,
        timestamp: Date.now(),
        paymentMethod: receipt.paymentMethod,
        items: receipt.items,
        total: receipt.total,
        tableNumber: receipt.tableNumber || 1,
        customerName: receipt.customerName || "",
        waiterName: receipt.waiterName || "Current User",
      }

      receipts.unshift(newReceipt)
      localStorage.setItem("pos_receipts", JSON.stringify(receipts))

      console.log("Receipt saved to localStorage:", newReceipt)
    } catch (error) {
      console.error("Error saving receipt to localStorage:", error)
    }
  }

  const generateReceiptHTML = (order: any) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${order.receiptId}</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              max-width: 300px;
              margin: 0 auto;
              padding: 20px;
              background: white;
              color: black;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
              margin-bottom: 15px;
            }
            .restaurant-name {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .restaurant-info {
              font-size: 12px;
              margin-bottom: 2px;
            }
            .order-info {
              margin-bottom: 15px;
              font-size: 12px;
            }
            .order-info div {
              margin-bottom: 3px;
            }
            .items {
              margin-bottom: 15px;
            }
            .item {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
              font-size: 12px;
            }
            .item-name {
              flex: 1;
              margin-right: 10px;
            }
            .item-qty {
              margin-right: 10px;
            }
            .item-price {
              text-align: right;
              min-width: 50px;
            }
            .totals {
              border-top: 1px solid #000;
              padding-top: 10px;
              margin-top: 15px;
            }
            .total-line {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
              font-size: 12px;
            }
            .final-total {
              font-weight: bold;
              font-size: 14px;
              border-top: 1px solid #000;
              padding-top: 5px;
              margin-top: 5px;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              padding-top: 15px;
              border-top: 1px solid #000;
              font-size: 11px;
            }
            @media print {
              body { margin: 0; padding: 10px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="restaurant-name">Bar POS</div>
            <div class="restaurant-info">26, Mock Street, Nigeria</div>
          </div>

          <div class="order-info">
            <div><strong>Receipt ID:</strong> ${order.receiptId}</div>
            <div><strong>Date:</strong> ${order.date}</div>
            <div><strong>Payment Method:</strong> ${order.paymentMethod.toUpperCase()}</div>
          </div>

          <div class="items">
            ${order.items
              .map(
                (item: any) => `
              <div class="item">
                <div class="item-name">${item.menu_item.name}</div>
                <div class="item-qty">${item.quantity}x</div>
                <div class="item-price">₦${item.total_price.toFixed(2)}</div>
              </div>
            `
              )
              .join("")}
          </div>

          <div class="totals">
            <div class="total-line final-total">
              <span>TOTAL:</span>
              <span>₦${order.total.toFixed(2)}</span>
            </div>
          </div>

          <div class="footer">
            <div>Thanks for your patronage. We hope to see you again.</div>
          </div>
        </body>
      </html>
    `
  }

  const handleProcessPayment = () => {
    if (currentOrder.items.length === 0) {
      toast({
        title: "Empty Order",
        description: "Please add items to the order before processing payment.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    setTimeout(() => {
      const receiptId = generateReceiptId()
      const orderId = `order-${Date.now()}`

      const receipt = {
        id: orderId,
        receiptId,
        date: new Date().toLocaleString(),
        paymentMethod,
        items: currentOrder.items,
        total: orderTotal,
        tableNumber: 1,
        customerName: "",
        waiterName: "Current User",
      }

      // Save to localStorage
      saveReceiptToStorage(receipt)

      setReceiptData(receipt)
      setShowReceiptModal(true)
      setIsSubmitting(false)

      onUpdateOrder({ items: [] })

      toast({
        title: "Payment Processed",
        description: `Payment has been processed successfully via ${paymentMethod}.`,
      })
    }, 1000)
  }

  return (
    <div className="w-full lg:w-80 border-l border-border bg-card/30 backdrop-blur-sm flex flex-col h-full lg:h-auto">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Order Summary</CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4">
        {/* Order Items */}
        <div className="flex-1 space-y-2">
          <Label className="text-sm font-medium">Items Ordered</Label>
          {currentOrder.items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No items in order
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {currentOrder.items.map((item) => (
                <Card key={item.id} className="p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.menu_item.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        ₦{item.unit_price.toFixed(2)} each
                      </p>
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
                      <span className="text-sm font-medium w-8 text-center">
                        {item.quantity}
                      </span>
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
                    <Badge variant="secondary">
                      ₦{item.total_price.toFixed(2)}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Payment Method */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Payment Method</Label>
          <RadioGroup
            value={paymentMethod}
            onValueChange={(value: "cash" | "card") => setPaymentMethod(value)}
            className="grid grid-cols-2 gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="cash" id="cash" />
              <Label
                htmlFor="cash"
                className="flex items-center gap-2 cursor-pointer"
              >
                <Banknote className="w-4 h-4" />
                Cash
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="card" id="card" />
              <Label
                htmlFor="card"
                className="flex items-center gap-2 cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                Card/Transfer
              </Label>
            </div>
          </RadioGroup>
        </div>

        <Separator />

        {/* Total & Process Payment */}
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
            {isSubmitting ? "Processing..." : "Print Receipt"}
          </Button>

          {/* Receipt Modal */}
          <Dialog open={showReceiptModal} onOpenChange={setShowReceiptModal}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Receipt Preview</DialogTitle>
              </DialogHeader>

              {receiptData && (
                <div className="space-y-4">
                  {/* Receipt Preview */}
                  <div className="bg-white text-black font-mono text-xs border rounded p-4">
                    <div className="text-center border-b-2 border-black pb-2 mb-3">
                      <div className="font-bold text-sm">Bar POS</div>
                      <div className="text-xs">26, Mock Street, Nigeria</div>
                    </div>

                    <div className="mb-3 text-xs">
                      <div>
                        <strong>Receipt ID:</strong> {receiptData.receiptId}
                      </div>
                      <div>
                        <strong>Date:</strong> {receiptData.date}
                      </div>
                      <div>
                        <strong>Payment Method:</strong>{" "}
                        {receiptData.paymentMethod.toUpperCase()}
                      </div>
                    </div>

                    <div className="mb-3">
                      {receiptData.items.map((item: any) => (
                        <div key={item.id} className="flex justify-between mb-1">
                          <div className="flex-1 mr-2">
                            {item.menu_item.name}
                          </div>
                          <div className="mr-2">{item.quantity}x</div>
                          <div className="text-right">
                            ₦{item.total_price.toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-black pt-2">
                      <div className="flex justify-between font-bold text-sm">
                        <span>TOTAL:</span>
                        <span>₦{receiptData.total.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="text-center mt-4 pt-3 border-t border-black">
                      <div>Thanks for your patronage. We hope to see you again.</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        const receiptHTML = generateReceiptHTML(receiptData)
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
                      <Printer className="w-4 h-4 mr-2" />
                      Print
                    </Button>
                    <Button
                      onClick={() => setShowReceiptModal(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </div>
  )
}
