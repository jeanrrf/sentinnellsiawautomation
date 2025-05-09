"use client"

import { usePathname } from "next/navigation"
import { AutoSearch } from "@/components/auto-search"
import { DesignerExport } from "@/components/designer-export"
import { ScheduleAutomation } from "@/components/schedule-automation"
import { CacheViewer } from "@/components/cache-viewer"

export function Dashboard() {
  const pathname = usePathname()

  // Determinar qual componente mostrar com base na rota atual
  const renderContent = () => {
    if (pathname.includes("/dashboard/busca") || pathname === "/dashboard") {
      return <AutoSearch />
    } else if (pathname.includes("/dashboard/designer")) {
      return <DesignerExport />
    } else if (pathname.includes("/dashboard/automacao")) {
      return <ScheduleAutomation />
    } else if (pathname.includes("/dashboard/publicacao")) {
      return <CacheViewer />
    } else {
      // Configurações ou outra página
      return <div>Configurações</div>
    }
  }

  return <div className="container mx-auto px-4 py-6">{renderContent()}</div>
}
