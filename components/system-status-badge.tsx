"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CheckCircle2, XCircle, AlertTriangle, RefreshCw } from "lucide-react"

export function SystemStatusBadge() {
  const [status, setStatus] = useState<"loading" | "operational" | "warning" | "error">("loading")
  const [message, setMessage] = useState<string>("Verificando status do sistema...")

  useEffect(() => {
    const checkStatus = async () => {
      try {
        // Adicionar timeout para evitar que a requisição fique pendente indefinidamente
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 segundos de timeout

        const response = await fetch("/api/system-status", {
          signal: controller.signal,
          cache: "no-store",
          next: { revalidate: 0 },
        }).catch((error) => {
          if (error.name === "AbortError") {
            throw new Error("Timeout ao verificar status do sistema")
          }
          throw error
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`Erro HTTP: ${response.status}`)
        }

        const data = await response.json()

        if (data.success) {
          if (data.warnings && data.warnings.length > 0) {
            setStatus("warning")
            setMessage("Sistema operacional com alertas")
          } else {
            setStatus("operational")
            setMessage("Sistema operacional")
          }
        } else {
          setStatus("error")
          setMessage(data.error || "Erro ao verificar status do sistema")
        }
      } catch (error) {
        console.error("Erro ao verificar status do sistema:", error)
        setStatus("error")
        setMessage(error.message || "Erro ao verificar status do sistema")
      }
    }

    checkStatus()
  }, [])

  const statusConfig = {
    loading: {
      color: "bg-gray-100 text-gray-800 hover:bg-gray-200",
      icon: <RefreshCw className="h-3 w-3 animate-spin mr-1" />,
      text: "Verificando...",
    },
    operational: {
      color: "bg-green-100 text-green-800 hover:bg-green-200",
      icon: <CheckCircle2 className="h-3 w-3 mr-1" />,
      text: "Operacional",
    },
    warning: {
      color: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
      icon: <AlertTriangle className="h-3 w-3 mr-1" />,
      text: "Alerta",
    },
    error: {
      color: "bg-red-100 text-red-800 hover:bg-red-200",
      icon: <XCircle className="h-3 w-3 mr-1" />,
      text: "Erro",
    },
  }

  const currentStatus = statusConfig[status]

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`${currentStatus.color} flex items-center`}>
            {currentStatus.icon}
            {currentStatus.text}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{message}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
