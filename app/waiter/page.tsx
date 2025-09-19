import { AuthGuard } from "@/components/auth-guard"
import { WaiterDashboard } from "@/components/waiter/waiter-dashboard"

export default function WaiterPage() {
  return (
    <AuthGuard requiredRole="waiter">
      <WaiterDashboard />
    </AuthGuard>
  )
}
