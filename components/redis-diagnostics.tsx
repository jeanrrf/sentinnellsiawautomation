"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, AlertTriangle, RefreshCw, Database } from "lucide-react"

export function RedisDiagnostics() {
  const [status, setStatus] = useState<"loading" | "connected" | "error" | "not-configured">("loading")
  const [details, setDetails] = useState<any>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [lastCheckTime, setLastCheckTime] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const checkRedisConnection = async () => {
    setIsChecking(true)
    setStatus("loading")
    setErrorMessage(null)

    try {
      // Adicionar timeout para evitar que a requisição fique pendente indefinidamente
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 segundos de timeout

      const response = await fetch("/api/redis-diagnostics", {
        signal: controller.signal,
        cache: "no-store",
        next: { revalidate: 0 },
      }).catch((error) => {
        if (error.name === "AbortError") {
          throw new Error("Timeout ao verificar conexão com Redis. A requisição demorou muito para responder.")
        }
        throw error
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.info("[RedisDiagnostics] Resposta recebida:", data)

      setDetails(data)

      if (!data.configured) {
        setStatus("not-configured")
      } else if (data.connected) {
        setStatus("connected")
      } else {
        setStatus("error")
        setErrorMessage(data.error || "Não foi possível conectar ao Redis")
      }

      setLastCheckTime(new Date().toLocaleTimeString())
    } catch (error) {
      console.error("[RedisDiagnostics] Erro ao verificar conexão com Redis:", error)
      setStatus("error")
      setErrorMessage(error.message)
      setLastCheckTime(new Date().toLocaleTimeString())
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    checkRedisConnection()
  }, [])

  const statusConfig = {
    loading: {
      color: "bg-gray-100",
      icon: <RefreshCw className="h-5 w-5 animate-spin" />,
      title: "Verificando...",
      description: "Verificando a conexão com o Redis...",
    },
    connected: {
      color: "bg-green-100 text-green-800",
      icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
      title: "Redis Conectado",
      description: "A conexão com o Redis está funcionando corretamente.",
    },
    error: {
      color: "bg-red-100 text-red-800",
      icon: <XCircle className="h-5 w-5 text-red-600" />,
      title: "Erro de Conexão",
      description: errorMessage || "Não foi possível conectar ao Redis.",
    },
    "not-configured": {
      color: "bg-yellow-100 text-yellow-800",
      icon: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
      title: "Redis Não Configurado",
      description: "As variáveis de ambiente do Redis não estão configuradas corretamente.",
    },
  }

  const currentStatus = statusConfig[status]

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center gap-2">
          <Database className="h-5 w-5" />
          Diagnóstico do Redis
        </CardTitle>
        <CardDescription>
          Verificação da conexão com o Redis
          {lastCheckTime && <span className="ml-2 text-xs text-gray-500">Última verificação: {lastCheckTime}</span>}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className={`${currentStatus.color} border-0`}>
          <AlertTitle className="flex items-center gap-2">{currentStatus.title}</AlertTitle>
          <AlertDescription>{currentStatus.description}</AlertDescription>
        </Alert>

        {details && status !== "loading" && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm font-medium">URL configurada:</div>
              <div className="text-sm">{details.configured ? "Sim" : "Não"}</div>

              <div className="text-sm font-medium">Token configurado:</div>
              <div className="text-sm">{details.configured ? "Sim" : "Não"}</div>

              <div className="text-sm font-medium">Status da conexão:</div>
              <div className="text-sm">
                <Badge
                  className={
                    details.connected
                      ? "bg-green-100 text-green-800"
                      : details.configured
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                  }
                >
                  {details.connected ? "Conectado" : details.configured ? "Falha" : "Não configurado"}
                </Badge>
              </div>

              {details.ping !== undefined && (
                <>
                  <div className="text-sm font-medium">Ping:</div>
                  <div className="text-sm">
                    <Badge className={details.ping ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {details.ping ? "Sucesso" : "Falha"}
                    </Badge>
                  </div>
                </>
              )}

              {details.latency !== undefined && (
                <>
                  <div className="text-sm font-medium">Latência:</div>
                  <div className="text-sm">{details.latency} ms</div>
                </>
              )}
            </div>

            {details.error && (
              <Alert variant="destructive">
                <AlertTitle>Erro de conexão</AlertTitle>
                <AlertDescription className="font-mono text-xs break-all">{details.error}</AlertDescription>
              </Alert>
            )}

            {details.suggestions && details.suggestions.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Sugestões:</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  {details.suggestions.map((suggestion: string, index: number) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" className="w-full" onClick={checkRedisConnection} disabled={isChecking}>
          {isChecking ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Verificando...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Verificar Novamente
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
