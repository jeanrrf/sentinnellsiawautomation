import { SystemStatusDashboard } from "@/components/system-status-dashboard"

export default function StatusPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Status do Sistema</h1>
      <p className="text-muted-foreground mb-6">
        Verifique o status do sistema, incluindo conexão com a API da Shopee, geração de vídeos e mais.
      </p>

      <SystemStatusDashboard />
    </div>
  )
}
