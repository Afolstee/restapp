"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Receipt, Printer, Download, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface OrderItem {
  id: string
  quantity: number
  unit_price: number
  total_price: number
  menu_item: {
    name: string
    description: string
  }
}

interface Order {
  id: string
  table_number: number
  customer_name?: string
  subtotal: number
  tax_amount: number
  total_amount: number
  payment_method?: string
  created_at: string
  waiter: {
    first_name: string
    last_name: string
  }
  order_items: OrderItem[]
}

interface ReceiptGeneratorProps {
  order: Order
  trigger?: React.ReactNode
}

export function ReceiptGenerator({ order, trigger }: ReceiptGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  const generateReceiptHTML = () => {
    const receiptDate = new Date(order.created_at).toLocaleString()

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - Order #${order.id.slice(-8)}</title>
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
            <div class="restaurant-name">RESTAURANT POS</div>
            <div class="restaurant-info">123 Main Street</div>
            <div class="restaurant-info">City, State 12345</div>
            <div class="restaurant-info">Phone: (555) 123-4567</div>
          </div>
          
          <div class="order-info">
            <div><strong>Order #:</strong> ${order.id.slice(-8).toUpperCase()}</div>
            <div><strong>Table:</strong> ${order.table_number}</div>
            ${order.customer_name ? `<div><strong>Customer:</strong> ${order.customer_name}</div>` : ""}
            <div><strong>Server:</strong> ${order.waiter.first_name} ${order.waiter.last_name}</div>
            <div><strong>Date:</strong> ${receiptDate}</div>
          </div>
          
          <div class="items">
            ${order.order_items
              .map(
                (item) => `
              <div class="item">
                <div class="item-name">${item.menu_item.name}</div>
                <div class="item-qty">${item.quantity}x</div>
                <div class="item-price">$${item.total_price.toFixed(2)}</div>
              </div>
            `,
              )
              .join("")}
          </div>
          
          <div class="totals">
            <div class="total-line">
              <span>Subtotal:</span>
              <span>$${order.subtotal.toFixed(2)}</span>
            </div>
            <div class="total-line">
              <span>Tax (8.75%):</span>
              <span>$${order.tax_amount.toFixed(2)}</span>
            </div>
            <div class="total-line final-total">
              <span>TOTAL:</span>
              <span>$${order.total_amount.toFixed(2)}</span>
            </div>
            ${
              order.payment_method
                ? `
              <div class="total-line">
                <span>Payment:</span>
                <span>${order.payment_method.toUpperCase()}</span>
              </div>
            `
                : ""
            }
          </div>
          
          <div class="footer">
            <div>Thank you for dining with us!</div>
            <div>Please come again soon</div>
            <div style="margin-top: 10px;">★★★★★</div>
          </div>
        </body>
      </html>
    `
  }

  const handlePrint = () => {
    const receiptHTML = generateReceiptHTML()
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(receiptHTML)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
      printWindow.close()
    }
  }

  const handleDownload = () => {
    const receiptHTML = generateReceiptHTML()
    const blob = new Blob([receiptHTML], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `receipt-${order.id.slice(-8)}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Receipt Downloaded",
      description: "Receipt has been saved to your downloads folder.",
    })
  }

  const handlePreview = () => {
    const receiptHTML = generateReceiptHTML()
    const previewWindow = window.open("", "_blank")
    if (previewWindow) {
      previewWindow.document.write(receiptHTML)
      previewWindow.document.close()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Receipt className="w-4 h-4 mr-2" />
            Receipt
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Receipt</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Receipt Preview */}
          <Card className="bg-white text-black font-mono text-xs">
            <CardContent className="p-4 max-w-xs mx-auto">
              <div className="text-center border-b-2 border-black pb-2 mb-3">
                <div className="font-bold text-sm">RESTAURANT POS</div>
                <div className="text-xs">123 Main Street</div>
                <div className="text-xs">City, State 12345</div>
                <div className="text-xs">Phone: (555) 123-4567</div>
              </div>

              <div className="mb-3 text-xs">
                <div>
                  <strong>Order #:</strong> {order.id.slice(-8).toUpperCase()}
                </div>
                <div>
                  <strong>Table:</strong> {order.table_number}
                </div>
                {order.customer_name && (
                  <div>
                    <strong>Customer:</strong> {order.customer_name}
                  </div>
                )}
                <div>
                  <strong>Server:</strong> {order.waiter.first_name} {order.waiter.last_name}
                </div>
                <div>
                  <strong>Date:</strong> {new Date(order.created_at).toLocaleString()}
                </div>
              </div>

              <div className="mb-3">
                {order.order_items.map((item) => (
                  <div key={item.id} className="flex justify-between mb-1">
                    <div className="flex-1 mr-2">{item.menu_item.name}</div>
                    <div className="mr-2">{item.quantity}x</div>
                    <div className="text-right">${item.total_price.toFixed(2)}</div>
                  </div>
                ))}
              </div>

              <div className="border-t border-black pt-2">
                <div className="flex justify-between mb-1">
                  <span>Subtotal:</span>
                  <span>${order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>Tax (8.75%):</span>
                  <span>${order.tax_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm border-t border-black pt-1 mt-1">
                  <span>TOTAL:</span>
                  <span>${order.total_amount.toFixed(2)}</span>
                </div>
                {order.payment_method && (
                  <div className="flex justify-between mt-1">
                    <span>Payment:</span>
                    <span>{order.payment_method.toUpperCase()}</span>
                  </div>
                )}
              </div>

              <div className="text-center mt-4 pt-3 border-t border-black">
                <div>Thank you for dining with us!</div>
                <div>Please come again soon</div>
                <div className="mt-2">★★★★★</div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={handlePrint} className="flex-1">
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button onClick={handleDownload} variant="outline" className="flex-1 bg-transparent">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button onClick={handlePreview} variant="outline" className="flex-1 bg-transparent">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
