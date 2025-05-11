"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Database,
  Settings,
  Terminal,
  Info,
  Server,
} from "lucide-react"

export function SystemStatusDashboard() {
  const [status, setStatus] = useState<"loading" | "operational" | "warning" | "error">("loading")
  const [details, setDetails] = useState<any>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [testResults, setTestResults] = useState<any>(null)
  const [isRunningTest, setIsRunningTest] = useState(false)
  const [errorLogs, setErrorLogs] = useState<string[]>([])
  const [lastCheckTime, setLastCheckTime] = useState<string | null>(null)

  const checkSystemStatus = async () => {
    setIsChecking(true)
    setErrorLogs([])

    try {
      console.info("[SystemStatus] Verificando status do sistema...")

      // Adicionar timeout para evitar que a requisição fique pendente indefinidamente
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 segundos de timeout

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

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.info("[SystemStatus] Resposta recebida:", data)

      if (data.success) {
        if (data.warnings && data.warnings.length > 0) {
          setStatus("warning")
          setErrorLogs((prev) => [...prev, ...data.warnings.map((w: any) => `AVISO: ${w.message || w}`)])
        } else {
          setStatus("operational")
        }
      } else {
        setStatus("error")
        if (data.error) {
          setErrorLogs((prev) => [...prev, `ERRO: ${data.error}`])
        }
      }

      setDetails(data)
      setLastCheckTime(new Date().toLocaleTimeString())
    } catch (error) {
      console.error("[SystemStatus] Erro ao verificar status do sistema:", error)
      setStatus("error")
      setDetails({
        error: error.message,
        fallback: true,
        timestamp: new Date().toISOString(),
        redis: { connected: false, info: "Não foi possível verificar" },
        storage: { writable: false, info: "Não foi possível verificar" },
        environment: {
          node: process.env.NODE_ENV || "development",
          platform: "browser",
          arch: "unknown",
          cpus: "unknown",
          memory: "unknown",
        },
        resources: {
          memoryUsage: "N/A",
          memoryPercentage: 0,
          elapsedTime: "N/A",
          timePercentage: 0,
        },
        config: {
          nodeEnv: process.env.NODE_ENV || "development",
          vercel: process.env.VERCEL === "1" ? "Sim" : "Não",
        },
      })
      setErrorLogs((prev) => [...prev, `ERRO: ${error.message}`])
      setLastCheckTime(new Date().toLocaleTimeString())
    } finally {
      setIsChecking(false)
    }
  }

  const runComponentTest = async (component: string) => {
    setIsRunningTest(true)
    setTestResults((prev: any) => ({
      ...prev,
      [component]: { status: "running", message: "Testando..." },
    }))

    try {
      console.info(`[SystemStatus] Testando componente: ${component}`)

      // Adicionar timeout para evitar que a requisição fique pendente indefinidamente
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 segundos de timeout

      const response = await fetch(`/api/test-component?component=${component}`, {
        signal: controller.signal,
        cache: "no-store",
        next: { revalidate: 0 },
      }).catch((error) => {
        if (error.name === "AbortError") {
          throw new Error("Timeout ao testar componente. A requisição demorou muito para responder.")
        }
        throw error
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.info(`[SystemStatus] Resultado do teste de ${component}:`, data)

      setTestResults((prev: any) => ({
        ...prev,
        [component]: {
          status: data.success ? "success" : "error",
          message: data.message,
          details: data.details,
          errorCode: data.errorCode,
        },
      }))

      if (!data.success && data.message) {
        setErrorLogs((prev) => [...prev, `ERRO (${component}): ${data.message}`])
      }
    } catch (error) {
      console.error(`[SystemStatus] Erro ao testar componente ${component}:`, error)
      setTestResults((prev: any) => ({
        ...prev,
        [component]: {
          status: "error",
          message: `Erro ao executar teste: ${error.message}`,
          details: {
            errorMessage: error.message,
            errorType: error.name,
          },
        },
      }))
      setErrorLogs((prev) => [...prev, `ERRO (${component}): ${error.message}`])
    } finally {
      setIsRunningTest(false)
    }
  }

  useEffect(() => {
    checkSystemStatus()

    // Inicializar resultados de teste
    setTestResults({
      redis: { status: "idle", message: "Não testado" },
      storage: { status: "idle", message: "Não testado" },
    })
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
      description: details?.fallback
        ? "Não foi possível conectar ao serviço de verificação de status."
        : "Ocorreu um problema ao verificar o status do sistema.",
    },
  }

  const currentStatus = statusConfig[status]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl flex items-center gap-2">
            {currentStatus.icon}
            Status do Sistema
          </CardTitle>
          <CardDescription>
            Verificação dos componentes
            {lastCheckTime && <span className="ml-2 text-xs text-gray-500">Última verificação: {lastCheckTime}</span>}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className={`${currentStatus.color} border-0`}>
            <AlertTitle className="flex items-center gap-2">{currentStatus.title}</AlertTitle>
            <AlertDescription>{currentStatus.description}</AlertDescription>
          </Alert>

          {status !== "loading" && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatusCard
                title="Redis"
                status={details?.redis?.connected ? "operational" : "error"}
                icon={<Database className="h-4 w-4" />}
              />
              <StatusCard
                title="Armazenamento"
                status={details?.storage?.writable ? "operational" : "error"}
                icon={<Terminal className="h-4 w-4" />}
              />
              <StatusCard
                title="API"
                status={details?.fallback ? "error" : "operational"}
                icon={<Server className="h-4 w-4" />}
              />
            </div>
          )}

          {errorLogs.length > 0 && (
            <div className="mt-4">
              <div className="text-sm font-medium mb-2 flex items-center gap-1">
                <Info className="h-4 w-4" />
                Logs de Erro
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md text-xs font-mono max-h-40 overflow-y-auto">
                {errorLogs.map((log, index) => (
                  <div key={index} className="py-1 border-b border-gray-200 dark:border-gray-700 last:border-0">
                    {log}
                  </div>
                ))}
              </div>
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="tests">Testes</TabsTrigger>
          <TabsTrigger value="config">Configuração</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {details && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recursos do Sistema</CardTitle>
                </CardHeader>
                <CardContent>
                  {details.resources && (
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Memória</span>
                          <span className="text-sm text-gray-500">{details.resources.memoryUsage || "N/A"}</span>
                        </div>
                        <Progress value={details.resources.memoryPercentage || 0} />
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Tempo de Execução</span>
                          <span className="text-sm text-gray-500">{details.resources.elapsedTime || "N/A"}</span>
                        </div>
                        <Progress value={details.resources.timePercentage || 0} />
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                          <span className="font-medium block mb-1">CPU:</span>
                          {details.environment?.cpus || "N/A"}
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                          <span className="font-medium block mb-1">Plataforma:</span>
                          {details.environment?.platform || "N/A"}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Componentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <ComponentItem name="Node.js" status="operational" details={details.environment?.node || "N/A"} />
                    <ComponentItem
                      name="Redis"
                      status={details.redis?.connected ? "operational" : "error"}
                      details={details.redis?.info || "Não conectado"}
                    />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="tests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Testes de Componentes</CardTitle>
              <CardDescription>Execute testes individuais para verificar cada componente do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <TestItem
                  name="Redis"
                  description="Testa a conexão com o Redis"
                  status={testResults?.redis?.status}
                  message={testResults?.redis?.message}
                  details={testResults?.redis?.details}
                  errorCode={testResults?.redis?.errorCode}
                  onTest={() => runComponentTest("redis")}
                  isRunning={isRunningTest && testResults?.redis?.status === "running"}
                />

                <TestItem
                  name="Armazenamento"
                  description="Testa a capacidade de armazenar e recuperar arquivos"
                  status={testResults?.storage?.status}
                  message={testResults?.storage?.message}
                  details={testResults?.storage?.details}
                  errorCode={testResults?.storage?.errorCode}
                  onTest={() => runComponentTest("storage")}
                  isRunning={isRunningTest && testResults?.storage?.status === "running"}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  runComponentTest("redis")
                  runComponentTest("storage")
                }}
                disabled={isRunningTest}
              >
                {isRunningTest ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Executando Testes...
                  </>
                ) : (
                  "Testar Todos os Componentes"
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configuração do Sistema</CardTitle>
              <CardDescription>Detalhes da configuração atual do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              {details?.config && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <ConfigItem name="NODE_ENV" value={process.env.NODE_ENV || "development"} status="success" />
                    <ConfigItem name="VERCEL" value={process.env.VERCEL === "1" ? "Sim" : "Não"} status="success" />
                  </div>

                  <Alert className="bg-blue-50 text-blue-800 border-blue-200">
                    <AlertTitle className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Configuração de Ambiente
                    </AlertTitle>
                    <AlertDescription className="text-sm">
                      Estas configurações são definidas através de variáveis de ambiente no projeto Vercel.
                      Certifique-se de que todas as variáveis necessárias estão configuradas corretamente.
                      {process.env.VERCEL === "1" && (
                        <div className="mt-2 font-medium">
                          Ambiente Vercel detectado: Alguns testes serão executados em modo simulado.
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Componentes auxiliares

function StatusCard({ title, status, icon }: { title: string; status: string; icon: React.ReactNode }) {
  const statusConfig = {
    operational: {
      color: "bg-green-50 text-green-700 border-green-200",
      icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    },
    warning: {
      color: "bg-yellow-50 text-yellow-700 border-yellow-200",
      icon: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
    },
    error: {
      color: "bg-red-50 text-red-700 border-red-200",
      icon: <XCircle className="h-4 w-4 text-red-500" />,
    },
  }

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.error

  return (
    <div className={`border rounded-lg p-3 ${config.color}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="font-medium text-sm">{title}</span>
        </div>
        {config.icon}
      </div>
      <div className="text-xs capitalize">
        {status === "operational" ? "Operacional" : status === "warning" ? "Aviso" : "Erro"}
      </div>
    </div>
  )
}

function ComponentItem({ name, status, details }: { name: string; status: string; details: string }) {
  const statusConfig = {
    operational: {
      badge: "bg-green-100 text-green-800",
      icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    },
    warning: {
      badge: "bg-yellow-100 text-yellow-800",
      icon: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
    },
    error: {
      badge: "bg-red-100 text-red-800",
      icon: <XCircle className="h-4 w-4 text-red-500" />,
    },
  }

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.error

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div>
        <div className="font-medium">{name}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 break-all">{details}</div>
      </div>
      <Badge className={config.badge}>
        <div className="flex items-center gap-1">
          {config.icon}
          <span>{status === "operational" ? "OK" : status === "warning" ? "Aviso" : "Erro"}</span>
        </div>
      </Badge>
    </div>
  )
}

function TestItem({
  name,
  description,
  status,
  message,
  details,
  errorCode,
  onTest,
  isRunning,
}: {
  name: string
  description: string
  status: string
  message: string
  details?: any
  errorCode?: string
  onTest: () => void
  isRunning: boolean
}) {
  const statusConfig = {
    idle: {
      color: "bg-gray-50 border-gray-200",
      icon: null,
    },
    running: {
      color: "bg-blue-50 border-blue-200",
      icon: <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />,
    },
    success: {
      color: "bg-green-50 border-green-200",
      icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    },
    error: {
      color: "bg-red-50 border-red-200",
      icon: <XCircle className="h-4 w-4 text-red-500" />,
    },
  }

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.idle

  return (
    <div className={`border rounded-lg p-4 ${config.color}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium">{name}</div>
        {config.icon}
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{description}</p>

      {status !== "idle" && (
        <div className="mb-3 text-sm">
          <div className="font-medium">Resultado:</div>
          <div className="mt-1">{message}</div>
          {errorCode && (
            <div className="mt-1 text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded inline-block">
              Código: {errorCode}
            </div>
          )}
          {details && typeof details === "object" && (
            <div className="mt-2 text-xs">
              <details className="cursor-pointer">
                <summary className="font-medium">Detalhes técnicos</summary>
                <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-700 rounded overflow-auto max-h-32">
                  {JSON.stringify(details, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      )}

      <Button
        size="sm"
        variant={status === "success" ? "outline" : "default"}
        className="w-full"
        onClick={onTest}
        disabled={isRunning}
      >
        {isRunning ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Testando...
          </>
        ) : status === "idle" ? (
          "Executar Teste"
        ) : (
          "Testar Novamente"
        )}
      </Button>
    </div>
  )
}

function ConfigItem({ name, value, status }: { name: string; value: string; status: string }) {
  return (
    <div className="flex flex-col p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="font-medium text-sm">{name}</div>
        {status === "success" ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : (
          <XCircle className="h-4 w-4 text-red-500" />
        )}
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 break-all">{value || "Não definido"}</div>
    </div>
  )
}
