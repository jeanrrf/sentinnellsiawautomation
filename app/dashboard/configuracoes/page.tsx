import { ConfiguracoesIntegradas } from "@/components/configuracoes-integradas"

export default function ConfiguracoesPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Configurações</h1>
      <p className="text-muted-foreground mb-6">Configure as integrações e preferências do sistema.</p>

      <ConfiguracoesIntegradas />
    </div>
  )
}
