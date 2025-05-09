import { Dashboard } from "@/components/dashboard"
import { DashboardHeader } from "@/components/dashboard-header"

export default function DashboardPage() {
  return (
    <div className="min-h-screen">
      <DashboardHeader />
      <Dashboard />
    </div>
  )
}
