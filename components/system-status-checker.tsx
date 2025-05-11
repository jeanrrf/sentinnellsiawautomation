"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { RefreshCw, CheckCircle2, XCircle, AlertTriangle } from "lucide-react"

export function SystemStatusChecker() {
  const [status, setStatus] = useState<"loading" | "operational" | "warning" | "error">("loading")
  const [details, setDetails] = useState<any>(null)
  const [isChecking, setIsChecking] = useState(false)

  const checkSystemStatus = async () => {
    setIsChecking(true)
    try {
      const response = await fetch("/api/system-check")
      const data = await response.json()

      if (data.success) {
        setStatus("operational")
      } else {
        setStatus("error")
      }

      setDetails(data)
    } catch (error) {
      console.error("Erro ao verificar status do sistema:", error)
      setStatus("error")
      setDetails({ error: error.message })
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    checkSystemStatus()
  }, [])

  const statusConfig = {
    loading: {
      color: "bg-gray-100",
      icon: <RefreshCw className="h-5 w-5 animate-spin" />,
      title: "Verificando...",
      description: "Verificando o status do sistema...",
    },
    operational: {
      color: "bg-green-100 text-green-800",
      icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
      title: "Sistema Operacional",
      description: "Todos os componentes estão funcionando corretamente.",
    },
    warning: {
      color: "bg-yellow-100 text-yellow-800",
      icon: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
      title: "Aviso",
      description: "O sistema está operacional, mas com algumas limitações.",
    },
    error: {
      color: "bg-red-100 text-red-800",
      icon: <XCircle className="h-5 w-5 text-red-600" />,
      title: "Erro",
      description: "Ocorreu um problema ao verificar o status do sistema.",
    },
  }

  const currentStatus = statusConfig[status]

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          {currentStatus.icon}
          Status do Sistema
        </CardTitle>
        <CardDescription>Verificação dos componentes do sistema</CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className={`${currentStatus.color} border-0`}>
          <AlertTitle className="flex items-center gap-2">{currentStatus.title}</AlertTitle>
          <AlertDescription>{currentStatus.description}</AlertDescription>
        </Alert>

        {details && (
          <div className="mt-4 space-y-3 text-sm">
            {details.resources && (
              <div>
                <h4 className="font-medium mb-1">Recursos:</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-gray-50 p-2 rounded">
                    <span className="font-medium">Memória:</span> {details.resources.memoryIncrease}
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <span className="font-medium">Tempo:</span> {details.resources.elapsedTime}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" className="w-full" onClick={checkSystemStatus} disabled={isChecking}>
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
