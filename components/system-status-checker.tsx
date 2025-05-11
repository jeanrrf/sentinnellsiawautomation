"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { RefreshCw, CheckCircle2, XCircle, AlertTriangle, Server, Activity, Cpu } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"

export function SystemStatusChecker() {
  const [status, setStatus] = useState<"loading" | "operational" | "warning" | "error">("loading")
  const [details, setDetails] = useState<any>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [progress, setProgress] = useState(0)
  const [lastCheckTime, setLastCheckTime] = useState<string | null>(null)
  const { toast } = useToast()

  const checkSystemStatus = async () => {
    setIsChecking(true)
    setStatus("loading")
    setProgress(0)

    try {
      // Simular progresso durante a verificação
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 300)

      // Adicionar timeout para evitar que a requisição fique pendente indefinidamente
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 segundos de timeout

      const response = await fetch("/api/system-check", {
        signal: controller.signal,
        cache: "no-store",
        next: { revalidate: 0 },
      }).catch((error) => {
        if (error.name === "AbortError") {
          throw new Error("Timeout ao verificar status do sistema. A requisição demorou muito para responder.")
        }
        throw error
      })

      clearTimeout(timeoutId)
      clearInterval(progressInterval)
      setProgress(100)

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success) {
        if (data.warnings && data.warnings.length > 0) {
          setStatus("warning")
        } else {
          setStatus("operational")
        }
      } else {
        setStatus("error")
      }

      setDetails(data)
      setLastCheckTime(new Date().toLocaleTimeString())

      // Notificar o usuário sobre o status
      if (data.success && (!data.warnings || data.warnings.length === 0)) {
        toast({
          title: "Sistema operacional",
          description: "Todos os componentes estão funcionando corretamente.",
          variant: "default",
        })
      } else if (data.success && data.warnings && data.warnings.length > 0) {
        toast({
          title: "Sistema com alertas",
          description: "O sistema está operacional, mas com algumas limitações.",
          variant: "warning",
        })
      } else {
        toast({
          title: "Erro no sistema",
          description: "Ocorreu um problema ao verificar o status do sistema.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao verificar status do sistema:", error)
      setStatus("error")
      setDetails({
        error: error.message || "Erro desconhecido",
        warnings: [],
        errors: [error.message || "Erro desconhecido"],
        components: {},
        resources: {
          elapsedTime: "N/A",
          memoryIncrease: "N/A",
          cpuUsage: "N/A",
          diskSpace: "N/A",
        },
      })
      setProgress(100)
      setLastCheckTime(new Date().toLocaleTimeString())

      toast({
        title: "Erro de verificação",
        description: error.message || "Não foi possível verificar o status do sistema.",
        variant: "destructive",
      })
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
    <Card className="shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            <CardTitle className="text-xl">Status do Sistema</CardTitle>
          </div>
        </div>
        <CardDescription>
          Verificação dos componentes do sistema
          {lastCheckTime && <span className="ml-2 text-xs text-gray-500">Última verificação: {lastCheckTime}</span>}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status === "loading" && (
          <div className="mb-4">
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <Alert className={`${currentStatus.color} border-0`}>
          <div className="flex items-center gap-2">
            {currentStatus.icon}
            <AlertTitle>{currentStatus.title}</AlertTitle>
          </div>
          <AlertDescription>{currentStatus.description}</AlertDescription>
        </Alert>

        {details && (
          <div className="mt-4 space-y-3 text-sm">
            {details.resources && (
              <div className="bg-gray-50 p-3 rounded-md">
                <h4 className="font-medium mb-2 flex items-center gap-1">
                  <Cpu className="h-4 w-4" />
                  Recursos do Sistema
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white p-2 rounded">
                    <span className="font-medium">Memória:</span> {details.resources.memoryIncrease || "N/A"}
                  </div>
                  <div className="bg-white p-2 rounded">
                    <span className="font-medium">Tempo:</span> {details.resources.elapsedTime || "N/A"}
                  </div>
                  {details.resources.cpuUsage && (
                    <div className="bg-white p-2 rounded">
                      <span className="font-medium">CPU:</span> {details.resources.cpuUsage}
                    </div>
                  )}
                  {details.resources.diskSpace && (
                    <div className="bg-white p-2 rounded">
                      <span className="font-medium">Disco:</span> {details.resources.diskSpace}
                    </div>
                  )}
                </div>
              </div>
            )}

            {details.components && Object.keys(details.components).length > 0 && (
              <div className="bg-gray-50 p-3 rounded-md">
                <h4 className="font-medium mb-2 flex items-center gap-1">
                  <Activity className="h-4 w-4" />
                  Status dos Componentes
                </h4>
                <div className="space-y-2">
                  {Object.entries(details.components).map(([name, componentStatus]) => (
                    <div key={name} className="flex justify-between items-center bg-white p-2 rounded text-xs">
                      <span>{name}</span>
                      <span
                        className={
                          componentStatus === "operational"
                            ? "text-green-600 font-medium"
                            : componentStatus === "warning"
                              ? "text-yellow-600 font-medium"
                              : "text-red-600 font-medium"
                        }
                      >
                        {componentStatus === "operational"
                          ? "Operacional"
                          : componentStatus === "warning"
                            ? "Alerta"
                            : "Erro"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {details.warnings && details.warnings.length > 0 && (
              <div className="bg-yellow-50 p-3 rounded-md">
                <h4 className="font-medium mb-2 text-yellow-800 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  Alertas
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-xs text-yellow-700">
                  {details.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {details.errors && details.errors.length > 0 && (
              <div className="bg-red-50 p-3 rounded-md">
                <h4 className="font-medium mb-2 text-red-800 flex items-center gap-1">
                  <XCircle className="h-4 w-4" />
                  Erros
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-xs text-red-700">
                  {details.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {details.error && (
              <div className="bg-red-50 p-3 rounded-md">
                <h4 className="font-medium mb-2 text-red-800 flex items-center gap-1">
                  <XCircle className="h-4 w-4" />
                  Erro
                </h4>
                <p className="text-xs text-red-700">{details.error}</p>
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
