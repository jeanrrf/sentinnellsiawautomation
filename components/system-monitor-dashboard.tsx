"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, RefreshCw, Database, HardDrive, Server, AlertTriangle, CheckCircle } from "lucide-react"

export function SystemMonitorDashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [redisStatus, setRedisStatus] = useState<any>(null)
  const [blobStatus, setBlobStatus] = useState<any>(null)
  const [systemStatus, setSystemStatus] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchSystemStatus = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Fetch Redis status
      const redisResponse = await fetch("/api/redis-status")
      if (!redisResponse.ok) throw new Error("Falha ao buscar status do Redis")
      const redisData = await redisResponse.json()

      // Fetch Blob storage status
      const blobResponse = await fetch("/api/blob-status")
      if (!blobResponse.ok) throw new Error("Falha ao buscar status do armazenamento Blob")
      const blobData = await blobResponse.json()

      // Fetch general system status
      const systemResponse = await fetch("/api/system-status")
      if (!systemResponse.ok) throw new Error("Falha ao buscar status do sistema")
      const systemData = await systemResponse.json()

      setRedisStatus(redisData)
      setBlobStatus(blobData)
      setSystemStatus(systemData)
    } catch (err: any) {
      console.error("Erro ao buscar status do sistema:", err)
      setError(err.message || "Erro ao buscar status do sistema")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSystemStatus()

    // Set up polling every 30 seconds
    const intervalId = setInterval(fetchSystemStatus, 30000)
    return () => clearInterval(intervalId)
  }, [])

  // Mock data for demonstration
  const mockRedisStatus = {
    connected: true,
    memoryUsage: {
      used: 24,
      total: 100,
      percentage: 24,
    },
    operations: {
      reads: 1250,
      writes: 345,
      deletes: 67,
    },
    keys: 432,
    uptime: "3d 12h 45m",
  }

  const mockBlobStatus = {
    connected: true,
    storage: {
      used: 256,
      total: 1024,
      percentage: 25,
    },
    files: {
      total: 128,
      images: 87,
      videos: 23,
      other: 18,
    },
    recentUploads: 12,
  }

  const mockSystemStatus = {
    healthy: true,
    services: {
      api: "healthy",
      scheduler: "healthy",
      worker: "healthy",
    },
    lastScheduledRun: "2023-05-10T15:30:00Z",
    pendingJobs: 3,
    completedJobs: 145,
  }

  // Use mock data if real data is not available
  const redis = redisStatus || mockRedisStatus
  const blob = blobStatus || mockBlobStatus
  const system = systemStatus || mockSystemStatus

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Status do Sistema</h2>
        <Button variant="outline" size="sm" onClick={fetchSystemStatus} disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg flex items-center">
                <Database className="h-5 w-5 text-primary mr-2" />
                Redis
              </CardTitle>
              <Badge variant={redis.connected ? "default" : "destructive"}>
                {redis.connected ? "Conectado" : "Desconectado"}
              </Badge>
            </div>
            <CardDescription>Cache e armazenamento temporário</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uso de Memória</span>
                  <span>{redis.memoryUsage.percentage}%</span>
                </div>
                <Progress value={redis.memoryUsage.percentage} className="h-2" />
              </div>

              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="flex flex-col items-center p-2 bg-muted rounded-md">
                  <span className="font-medium">{redis.operations.reads}</span>
                  <span className="text-xs text-muted-foreground">Leituras</span>
                </div>
                <div className="flex flex-col items-center p-2 bg-muted rounded-md">
                  <span className="font-medium">{redis.operations.writes}</span>
                  <span className="text-xs text-muted-foreground">Escritas</span>
                </div>
                <div className="flex flex-col items-center p-2 bg-muted rounded-md">
                  <span className="font-medium">{redis.keys}</span>
                  <span className="text-xs text-muted-foreground">Chaves</span>
                </div>
              </div>

              <div className="text-sm">
                <span className="text-muted-foreground">Uptime:</span> {redis.uptime}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg flex items-center">
                <HardDrive className="h-5 w-5 text-primary mr-2" />
                Blob Storage
              </CardTitle>
              <Badge variant={blob.connected ? "default" : "destructive"}>
                {blob.connected ? "Conectado" : "Desconectado"}
              </Badge>
            </div>
            <CardDescription>Armazenamento de arquivos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uso de Armazenamento</span>
                  <span>
                    {blob.storage.used} MB / {blob.storage.total} MB ({blob.storage.percentage}%)
                  </span>
                </div>
                <Progress value={blob.storage.percentage} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex flex-col items-center p-2 bg-muted rounded-md">
                  <span className="font-medium">{blob.files.total}</span>
                  <span className="text-xs text-muted-foreground">Arquivos Totais</span>
                </div>
                <div className="flex flex-col items-center p-2 bg-muted rounded-md">
                  <span className="font-medium">{blob.recentUploads}</span>
                  <span className="text-xs text-muted-foreground">Uploads Recentes</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="flex flex-col items-center p-2 bg-muted rounded-md">
                  <span className="font-medium">{blob.files.images}</span>
                  <span className="text-xs text-muted-foreground">Imagens</span>
                </div>
                <div className="flex flex-col items-center p-2 bg-muted rounded-md">
                  <span className="font-medium">{blob.files.videos}</span>
                  <span className="text-xs text-muted-foreground">Vídeos</span>
                </div>
                <div className="flex flex-col items-center p-2 bg-muted rounded-md">
                  <span className="font-medium">{blob.files.other}</span>
                  <span className="text-xs text-muted-foreground">Outros</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg flex items-center">
                <Server className="h-5 w-5 text-primary mr-2" />
                Sistema
              </CardTitle>
              <Badge variant={system.healthy ? "default" : "destructive"}>
                {system.healthy ? "Saudável" : "Problemas"}
              </Badge>
            </div>
            <CardDescription>Status geral do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Status dos Serviços</div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                    <span className="text-xs">API</span>
                    {system.services.api === "healthy" ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                    <span className="text-xs">Scheduler</span>
                    {system.services.scheduler === "healthy" ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                    <span className="text-xs">Worker</span>
                    {system.services.worker === "healthy" ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex flex-col items-center p-2 bg-muted rounded-md">
                  <span className="font-medium">{system.pendingJobs}</span>
                  <span className="text-xs text-muted-foreground">Jobs Pendentes</span>
                </div>
                <div className="flex flex-col items-center p-2 bg-muted rounded-md">
                  <span className="font-medium">{system.completedJobs}</span>
                  <span className="text-xs text-muted-foreground">Jobs Concluídos</span>
                </div>
              </div>

              <div className="text-sm">
                <span className="text-muted-foreground">Última execução:</span>{" "}
                {new Date(system.lastScheduledRun).toLocaleString("pt-BR")}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Atividades</CardTitle>
          <CardDescription>Atividades recentes do sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="cards">Cards</TabsTrigger>
              <TabsTrigger value="automation">Automação</TabsTrigger>
              <TabsTrigger value="system">Sistema</TabsTrigger>
            </TabsList>
            <div className="mt-4 border rounded-md p-4">
              <p className="text-center text-muted-foreground">
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                ) : (
                  "Histórico de atividades será exibido aqui"
                )}
              </p>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
