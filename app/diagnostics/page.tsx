"use client"

import { SystemStatusChecker } from "@/components/system-status-checker"

export default function DiagnosticsPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Diagnósticos do Sistema</h1>
      <p className="text-muted-foreground mb-6">
        Execute diagnósticos para verificar se todos os componentes do sistema estão funcionando corretamente.
      </p>

      <SystemStatusChecker />
    </div>
  )
}
