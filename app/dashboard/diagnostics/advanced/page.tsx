import { ErrorDashboard } from "@/components/advanced-logging/error-dashboard"

export default function AdvancedDiagnosticsPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Diagnóstico Avançado</h1>
      <ErrorDashboard />
    </div>
  )
}
