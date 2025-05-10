import { SystemStatusDashboard } from "@/components/system-status-dashboard"

export const metadata = {
  title: "Status do Sistema | Gerador de Vídeos TikTok",
  description: "Verifique o status e a configuração do sistema de geração de vídeos para TikTok",
}

export default function StatusPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Status do Sistema</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">
        Verifique se todos os componentes do sistema de geração de vídeos estão funcionando corretamente.
      </p>

      <SystemStatusDashboard />
    </div>
  )
}
