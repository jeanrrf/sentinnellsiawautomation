import { CacheCleaner } from "@/components/cache-cleaner"
import { SystemStatusDashboard } from "@/components/system-status-dashboard"

export default function ConfiguracoesPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold mb-6">Configurações do Sistema</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Status do Sistema</h2>
          <SystemStatusDashboard />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Manutenção</h2>
          <CacheCleaner />
        </div>
      </div>
    </div>
  )
}
