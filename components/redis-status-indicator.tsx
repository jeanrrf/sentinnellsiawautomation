"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, CheckCircle, Database, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export function RedisStatusIndicator() {
  const [status, setStatus] = useState<"loading" | "connected" | "error" | "not-configured">("loading")
  const [isChecking, setIsChecking] = useState(false)

  const checkRedisStatus = async () => {
    setIsChecking(true)
    try {
      const response = await fetch("/api/redis-status", {
        cache: "no-store",
        next: { revalidate: 0 },
      })

      if (!response.ok) {
        setStatus("error")
        return
      }

      const data = await response.json()

      if (!data.configured) {
        setStatus("not-configured")
      } else if (data.connected) {
        setStatus("connected")
      } else {
        setStatus("error")
      }
    } catch (error) {
      console.error("Erro ao verificar status do Redis:", error)
      setStatus("error")
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      checkRedisStatus()
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1 px-2"
              onClick={checkRedisStatus}
              disabled={isChecking}
            >
              {status === "loading" || isChecking ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : status === "connected" ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              )}
              <Database className="h-4 w-4" />
              <Badge
                variant="outline"
                className={
                  status === "connected"
                    ? "bg-green-50 text-green-700 border-green-200"
                    : status === "error"
                      ? "bg-red-50 text-red-700 border-red-200"
                      : "bg-gray-50"
                }
              >
                {status === "loading"
                  ? "Verificando..."
                  : status === "connected"
                    ? "Redis Conectado"
                    : status === "error"
                      ? "Redis Offline"
                      : "Não Configurado"}
              </Badge>
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="text-sm">
            <p className="font-medium mb-1">
              {status === "loading"
                ? "Verificando conexão com Redis..."
                : status === "connected"
                  ? "Redis está conectado"
                  : status === "error"
                    ? "Redis está offline"
                    : "Redis não está configurado"}
            </p>
            <p className="text-xs text-muted-foreground">
              {status === "connected"
                ? "Todas as funcionalidades estão disponíveis"
                : "O sistema está usando dados simulados"}
            </p>
            <Link href="/dashboard/status" className="text-xs text-blue-500 hover:underline block mt-1">
              Ver detalhes
            </Link>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
