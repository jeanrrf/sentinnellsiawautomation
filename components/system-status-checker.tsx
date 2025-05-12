"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw, CheckCircle, AlertTriangle, XCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

export function SystemStatusChecker() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [systemStatus, setSystemStatus] = useState<any>(null)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const checkSystemStatus = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/system-status")

      if (!response.ok) {
        throw new Error(`Failed to check system status: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      setSystemStatus(data)
      setLastChecked(new Date())
    } catch (err: any) {
      setError(err.message || "Failed to check system status")
      console.error("Error checking system status:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkSystemStatus()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "degraded":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "unhealthy":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status do Sistema</CardTitle>
        <CardDescription>Verificação do status dos serviços do sistema</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading && !systemStatus ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : systemStatus ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">API</h3>
                <div className="flex items-center gap-2">
                  {getStatusIcon(systemStatus.services.api.status)}
                  <span className="capitalize">{systemStatus.services.api.status}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Uptime: {Math.floor(systemStatus.services.api.uptime / 60)} minutos
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Armazenamento</h3>
                <div className="flex items-center gap-2">
                  {getStatusIcon(systemStatus.services.storage.status)}
                  <span className="capitalize">{systemStatus.services.storage.status}</span>
                </div>
                <p className="text-xs text-muted-foreground">Tipo: {systemStatus.services.storage.type}</p>
                {systemStatus.services.storage.note && (
                  <p className="text-xs text-muted-foreground">{systemStatus.services.storage.note}</p>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Sistema</h3>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{systemStatus.system.platform}</Badge>
                  <Badge variant="outline">{systemStatus.system.nodeVersion}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Memória: {formatBytes(systemStatus.system.memory.free)} livre de{" "}
                  {formatBytes(systemStatus.system.memory.total)}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
      <CardFooter>
        <div className="flex justify-between items-center w-full">
          {lastChecked && (
            <span className="text-xs text-muted-foreground">
              Última verificação: {lastChecked.toLocaleTimeString()}
            </span>
          )}
          <Button variant="outline" onClick={checkSystemStatus} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Verificar Novamente
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
