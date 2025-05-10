"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { DesignerExport } from "@/components/designer-export"
import { AutoSearch } from "@/components/auto-search"
import { ScheduleAutomation } from "@/components/schedule-automation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

/**
 * Dashboard - Componente principal do painel de controle
 */
export function Dashboard() {
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState("designer")
  const [isLoading, setIsLoading] = useState(true)

  // Determinar a aba ativa com base no pathname
  useEffect(() => {
    setIsLoading(true)
    if (pathname.includes("/busca")) {
      setActiveTab("search")
    } else if (pathname.includes("/designer")) {
      setActiveTab("designer")
    } else if (pathname.includes("/automacao")) {
      setActiveTab("automation")
    } else if (pathname.includes("/publicacao")) {
      setActiveTab("publication")
    } else if (pathname.includes("/configuracoes")) {
      setActiveTab("settings")
    } else {
      setActiveTab("designer") // Default
    }
    setIsLoading(false)
  }, [pathname])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
        <Button variant="ghost" size="icon" disabled>
          <Loader2 className="h-6 w-6 animate-spin" />
        </Button>
      </div>
    )
  }

  // Renderizar o conteúdo com base na aba ativa
  const renderContent = () => {
    switch (activeTab) {
      case "search":
        return <AutoSearch />
      case "designer":
        return <DesignerExport />
      case "automation":
        return <ScheduleAutomation />
      case "publication":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Publicação</CardTitle>
              <CardDescription>Gerencie a publicação de vídeos no TikTok</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Conteúdo da aba de publicação</p>
            </CardContent>
          </Card>
        )
      case "settings":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Configurações</CardTitle>
              <CardDescription>Configure as opções do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Conteúdo da aba de configurações</p>
            </CardContent>
          </Card>
        )
      default:
        return <DesignerExport />
    }
  }

  return <div className="container mx-auto">{renderContent()}</div>
}
