"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { QuickMediaAccess } from "@/components/quick-media-access"
import { Info, ArrowRight, TrendingUp, Zap, ImageIcon, Search, Palette, Settings, Video, Package } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface SystemStatus {
  status: "online" | "partial" | "offline"
  message: string
  services: {
    name: string
    status: "online" | "offline" | "degraded"
  }[]
}

interface Metrics {
  totalProducts: number
  totalVideos: number
  totalCards: number
  pendingTasks: number
  completedTasks: number
}

export function DashboardOverview() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simular carregamento de status do sistema e métricas
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Em um ambiente real, você faria chamadas de API aqui
        // Simulando dados para demonstração
        setTimeout(() => {
          setSystemStatus({
            status: "online",
            message: "Todos os sistemas operacionais",
            services: [
              { name: "API Shopee", status: "online" },
              { name: "Geração de Vídeos", status: "online" },
              { name: "Armazenamento", status: "online" },
              { name: "Processamento de Imagens", status: "online" },
            ],
          })

          setMetrics({
            totalProducts: 1248,
            totalVideos: 356,
            totalCards: 892,
            pendingTasks: 12,
            completedTasks: 324,
          })

          setIsLoading(false)
        }, 1000)
      } catch (error) {
        console.error("Erro ao carregar dados do dashboard:", error)
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const renderStatusBadge = (status: "online" | "offline" | "degraded" | "partial") => {
    switch (status) {
      case "online":
        return <Badge className="bg-green-500">Online</Badge>
      case "degraded":
        return <Badge className="bg-yellow-500">Degradado</Badge>
      case "partial":
        return <Badge className="bg-yellow-500">Parcial</Badge>
      case "offline":
        return <Badge variant="destructive">Offline</Badge>
    }
  }

  const renderMetricCard = (title: string, value: number, icon: React.ReactNode, href: string) => (
    <Card className="overflow-hidden">
      <CardHeader className="p-4 pb-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        {isLoading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold">{value.toLocaleString()}</p>
            <div className="rounded-full bg-primary/10 p-2 text-primary">{icon}</div>
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t bg-muted/50 p-2">
        <Link href={href} className="text-xs text-muted-foreground hover:underline w-full text-right">
          Ver detalhes
        </Link>
      </CardFooter>
    </Card>
  )

  const renderFeatureCard = (
    title: string,
    description: string,
    icon: React.ReactNode,
    href: string,
    isNew = false,
  ) => (
    <Card
      className="overflow-hidden hover:border-primary transition-colors cursor-pointer group"
      onClick={() => router.push(href)}
    >
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="rounded-full bg-primary/10 p-2 text-primary">{icon}</div>
          {isNew && (
            <Badge variant="default" className="bg-green-500 hover:bg-green-600">
              NOVO
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <CardTitle className="text-lg mb-1">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardContent>
      <CardFooter className="border-t bg-muted/50 p-2">
        <div className="flex items-center justify-end w-full text-xs text-primary group-hover:underline">
          Acessar
          <ArrowRight className="ml-1 h-3 w-3" />
        </div>
      </CardFooter>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo ao Shopee TikTok Generator. Gerencie seus produtos e crie conteúdo automatizado.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {systemStatus && (
            <div className="flex items-center gap-2 text-sm">
              <span>Status do Sistema:</span>
              {renderStatusBadge(systemStatus.status)}
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="features">Funcionalidades</TabsTrigger>
          <TabsTrigger value="status">Status do Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {metrics && (
              <>
                {renderMetricCard(
                  "Total de Produtos",
                  metrics.totalProducts,
                  <Package className="h-4 w-4" />,
                  "/dashboard/busca",
                )}
                {renderMetricCard(
                  "Vídeos Gerados",
                  metrics.totalVideos,
                  <Video className="h-4 w-4" />,
                  "/dashboard/designer",
                )}
                {renderMetricCard(
                  "Cards Criados",
                  metrics.totalCards,
                  <ImageIcon className="h-4 w-4" />,
                  "/dashboard/cards-animados",
                )}
                {renderMetricCard(
                  "Tarefas Pendentes",
                  metrics.pendingTasks,
                  <Settings className="h-4 w-4" />,
                  "/dashboard/automacao",
                )}
              </>
            )}
            {isLoading && (
              <>
                <Card>
                  <CardContent className="p-4">
                    <Skeleton className="h-24 w-full" />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <Skeleton className="h-24 w-full" />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <Skeleton className="h-24 w-full" />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <Skeleton className="h-24 w-full" />
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Atividade Recente</CardTitle>
                <CardDescription>Veja as últimas atividades realizadas no sistema.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="relative h-10 w-10 rounded-full overflow-hidden">
                        <Image src="/diverse-products-still-life.png" alt="Produto" fill className="object-cover" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">Vídeo gerado para "Smartphone XYZ Pro"</p>
                        <p className="text-xs text-muted-foreground">Há 2 horas atrás</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Ver
                      </Button>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="relative h-10 w-10 rounded-full overflow-hidden">
                        <Image src="/playing-cards-scattered.png" alt="Card" fill className="object-cover" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">Card criado para "Fone de Ouvido Bluetooth"</p>
                        <p className="text-xs text-muted-foreground">Há 3 horas atrás</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Ver
                      </Button>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="relative h-10 w-10 rounded-full overflow-hidden">
                        <Image src="/search-icon.png" alt="Busca" fill className="object-cover" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">Busca realizada por "smartwatch"</p>
                        <p className="text-xs text-muted-foreground">Há 5 horas atrás</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Ver
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  Ver Todas as Atividades
                </Button>
              </CardFooter>
            </Card>

            <QuickMediaAccess />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Produtos em Alta</CardTitle>
                <CardDescription>Produtos mais populares na Shopee agora.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Smartphone XYZ Pro Max</span>
                      </div>
                      <Badge variant="outline">1250 vendas</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Fone de Ouvido Bluetooth Premium</span>
                      </div>
                      <Badge variant="outline">3420 vendas</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Smartwatch Fitness Tracker</span>
                      </div>
                      <Badge variant="outline">2150 vendas</Badge>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => router.push("/dashboard/tendencias")}>
                  Ver Todos os Produtos em Alta
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Automação</CardTitle>
                <CardDescription>Status das tarefas automatizadas.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Geração de vídeos diários</span>
                      </div>
                      <Badge variant="outline" className="bg-green-100 text-green-800">
                        Ativo
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Atualização de produtos</span>
                      </div>
                      <Badge variant="outline" className="bg-green-100 text-green-800">
                        Ativo
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Publicação automática</span>
                      </div>
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                        Pendente
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => router.push("/dashboard/automacao")}>
                  Gerenciar Automação
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {renderFeatureCard(
              "Busca de Produtos",
              "Pesquise produtos da Shopee para criar conteúdo",
              <Search className="h-4 w-4" />,
              "/dashboard/busca",
            )}
            {renderFeatureCard(
              "Designer de Vídeos",
              "Crie vídeos personalizados para seus produtos",
              <Palette className="h-4 w-4" />,
              "/dashboard/designer",
            )}
            {renderFeatureCard(
              "Geração Rápida",
              "Crie conteúdo com apenas um clique",
              <Zap className="h-4 w-4" />,
              "/dashboard/one-click",
            )}
            {renderFeatureCard(
              "Mídia do Produto",
              "Acesse imagens e vídeos dos produtos",
              <ImageIcon className="h-4 w-4" />,
              "/dashboard/midia-produto",
              true,
            )}
            {renderFeatureCard(
              "Produtos em Alta",
              "Veja os produtos mais populares por categoria",
              <TrendingUp className="h-4 w-4" />,
              "/dashboard/tendencias",
              true,
            )}
            {renderFeatureCard(
              "Automação",
              "Configure tarefas automatizadas",
              <Settings className="h-4 w-4" />,
              "/dashboard/automacao",
            )}
          </div>
        </TabsContent>

        <TabsContent value="status" className="space-y-6">
          {systemStatus && (
            <>
              <Alert variant={systemStatus.status === "online" ? "default" : "destructive"}>
                <Info className="h-4 w-4" />
                <AlertTitle>Status do Sistema</AlertTitle>
                <AlertDescription>{systemStatus.message}</AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <CardTitle>Serviços</CardTitle>
                  <CardDescription>Status dos serviços do sistema</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {systemStatus.services.map((service) => (
                      <div key={service.name} className="flex items-center justify-between">
                        <span>{service.name}</span>
                        {renderStatusBadge(service.status)}
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" onClick={() => router.push("/diagnostics")}>
                    Ver Diagnóstico Completo
                  </Button>
                </CardFooter>
              </Card>
            </>
          )}

          {isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-60" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
