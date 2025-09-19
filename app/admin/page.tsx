import { AuthGuard } from "@/components/auth-guard"
import { AdminDashboard } from "@/components/admin/admin-dashboard"

export default function AdminPage() {
  return (
    <AuthGuard requiredRole="admin">
      <AdminDashboard />
    </AuthGuard>
  )
}
