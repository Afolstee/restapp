import { createClient } from "@/lib/supabase/server"
import { ReceiptGenerator } from "@/components/receipt/receipt-generator"
import { notFound } from "next/navigation"

interface ReceiptPageProps {
  params: Promise<{ orderId: string }>
}

export default async function ReceiptPage({ params }: ReceiptPageProps) {
  const { orderId } = await params
  const supabase = await createClient()

  try {
    const { data: order, error } = await supabase
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

    if (error || !order) {
      notFound()
    }

    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-6 text-center">Order Receipt</h1>
          <ReceiptGenerator order={order} />
        </div>
      </div>
    )
  } catch (error) {
    console.error("Error fetching order:", error)
    notFound()
  }
}
