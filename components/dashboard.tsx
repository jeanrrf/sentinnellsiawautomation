"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { DesignerExport } from "@/components/designer-export"
import { AutoSearch } from "@/components/auto-search"
import { ScheduleAutomation } from "@/components/schedule-automation"
import { IntegratedCardStudio } from "@/components/integrated-card-studio"
import { SystemMonitorDashboard } from "@/components/system-monitor-dashboard"
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
  const [products, setProducts] = useState([]) // Assuming you have a products state

  // Determinar a aba ativa com base no pathname
  useEffect(() => {
    setIsLoading(true)
    if (pathname.includes("/busca")) {
      setActiveTab("search")
    } else if (pathname.includes("/designer")) {
      setActiveTab("designer")
    } else if (pathname.includes("/automacao")) {
      setActiveTab("automation")
    } else if (pathname.includes("/studio")) {
      setActiveTab("studio")
    } else if (pathname.includes("/templates")) {
      setActiveTab("templates")
    } else if (pathname.includes("/monitoring")) {
      setActiveTab("monitoring")
    } else if (pathname.includes("/documentation")) {
      setActiveTab("documentation")
    } else if (pathname.includes("/configuracoes")) {
      setActiveTab("settings")
    } else {
      setActiveTab("designer") // Default
    }
    setIsLoading(false)
  }, [pathname])

  useEffect(() => {
    // Simulate fetching products (replace with your actual data fetching logic)
    const fetchProducts = async () => {
      // Example:
      // const data = await fetch('/api/products');
      // const products = await data.json();
      // setProducts(products);
      setProducts([
        { id: 1, name: "Product 1" },
        { id: 2, name: "Product 2" },
      ]) // Example data
    }

    fetchProducts()
  }, [])

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
        return <DesignerExport products={products.length > 0 ? products : []} />
      case "automation":
        return <ScheduleAutomation />
      case "studio":
        return <IntegratedCardStudio />
      case "templates":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Templates</CardTitle>
              <CardDescription>Gerencie e personalize templates para seus cards</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Carregando gerenciador de templates...</p>
            </CardContent>
          </Card>
        )
      case "monitoring":
        return <SystemMonitorDashboard />
      case "documentation":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Documentação</CardTitle>
              <CardDescription>Acesse a documentação completa do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Carregando documentação...</p>
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
              <p>Carregando configurações...</p>
            </CardContent>
          </Card>
        )
      default:
        return <DesignerExport products={products.length > 0 ? products : []} />
    }
  }

  return <div className="container mx-auto">{renderContent()}</div>
}
