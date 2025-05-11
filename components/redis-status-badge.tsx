"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, AlertTriangle, RefreshCw } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function RedisStatusBadge() {
  const [status, setStatus] = useState<"loading" | "connected" | "error" | "not-configured" | "degraded">("loading")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  const checkRedisConnection = async () => {
    if (isChecking) return

    setIsChecking(true)
    setStatus("loading")

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch("/api/redis-diagnostics", {
        signal: controller.signal,
        cache: "no-store",
        next: { revalidate: 0 },
      }).catch((error) => {
        clearTimeout(timeoutId)
        throw error
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`)
      }

      const data = await response.json()

      if (!data.configured) {
        setStatus("not-configured")
      } else if (data.connected) {
        setStatus("connected")
      } else if (data.degraded) {
        setStatus("degraded")
        setErrorMessage(data.message || "Redis está operando em modo degradado")
      } else {
        setStatus("error")
        setErrorMessage(data.error || "Não foi possível conectar ao Redis")
      }
    } catch (error) {
      console.error("[RedisStatusBadge] Erro:", error)
      setStatus("error")
      setErrorMessage(error.message || "Erro ao verificar conexão")
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      checkRedisConnection()
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  const statusConfig = {
    loading: {
      color: "bg-gray-100 text-gray-800 hover:bg-gray-200",
      icon: <RefreshCw className="h-3 w-3 animate-spin" />,
      text: "Verificando Redis...",
      tooltip: "Verificando a conexão com o Redis...",
    },
    connected: {
      color: "bg-green-100 text-green-800 hover:bg-green-200",
      icon: <CheckCircle2 className="h-3 w-3" />,
      text: "Redis Conectado",
      tooltip: "A conexão com o Redis está funcionando corretamente.",
    },
    degraded: {
      color: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
      icon: <AlertTriangle className="h-3 w-3" />,
      text: "Redis Degradado",
      tooltip: errorMessage || "Redis está operando com funcionalidade limitada.",
    },
    error: {
      color: "bg-red-100 text-red-800 hover:bg-red-200",
      icon: <XCircle className="h-3 w-3" />,
      text: "Redis Offline",
      tooltip: errorMessage || "Não foi possível conectar ao Redis.",
    },
    "not-configured": {
      color: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
      icon: <AlertTriangle className="h-3 w-3" />,
      text: "Redis Não Configurado",
      tooltip: "As variáveis de ambiente do Redis não estão configuradas.",
    },
  }

  const currentStatus = statusConfig[status]

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            className={`${currentStatus.color} cursor-help`}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (!isChecking) checkRedisConnection()
            }}
          >
            <span className="flex items-center gap-1">
              {currentStatus.icon}
              <span className="text-xs">{currentStatus.text}</span>
            </span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{currentStatus.tooltip}</p>
          {status === "error" && <p className="text-xs mt-1">Clique para verificar novamente</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
