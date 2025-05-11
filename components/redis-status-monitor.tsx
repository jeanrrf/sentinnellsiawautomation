"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Database,
  ServerOff,
  Clock,
  Settings,
  ArrowRight,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"

export function RedisStatusMonitor() {
  const [status, setStatus] = useState<"loading" | "connected" | "error" | "not-configured" | "degraded">("loading")
  const [details, setDetails] = useState<any>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [lastCheckTime, setLastCheckTime] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("status")
  const [retryCount, setRetryCount] = useState(0)
  const [autoRetry, setAutoRetry] = useState(false)
  const [progress, setProgress] = useState(0)
  const { toast } = useToast()

  const checkRedisConnection = async () => {
    setIsChecking(true)
    setStatus("loading")
    setErrorMessage(null)
    setProgress(0)

    try {
      // Adicionar timeout para evitar que a requisição fique pendente indefinidamente
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 segundos de timeout

      // Simular progresso durante a verificação
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 800)

      // Usar try/catch específico para a requisição fetch
      let response
      try {
        response = await fetch("/api/redis-diagnostics", {
          signal: controller.signal,
          cache: "no-store",
          next: { revalidate: 0 },
        })
      } catch (fetchError) {
        clearTimeout(timeoutId)
        clearInterval(progressInterval)

        if (fetchError.name === "AbortError") {
          throw new Error("Timeout ao verificar conexão com Redis. A requisição demorou muito para responder.")
        }
        throw fetchError
      }

      clearTimeout(timeoutId)
      clearInterval(progressInterval)
      setProgress(100)

      // Verificar se a resposta é ok
      if (!response.ok) {
        let errorText = "Erro desconhecido"
        try {
          // Tentar obter o texto do erro
          errorText = await response.text()
        } catch (textError) {
          console.error("[RedisStatusMonitor] Erro ao obter texto da resposta:", textError)
        }

        console.error("[RedisStatusMonitor] Resposta de erro:", response.status, errorText)
        throw new Error(`Erro HTTP: ${response.status} ${response.statusText || ""}`)
      }

      // Tentar processar o JSON com tratamento de erro específico
      let data
      try {
        data = await response.json()
      } catch (jsonError) {
        console.error("[RedisStatusMonitor] Erro ao processar JSON:", jsonError)
        throw new Error(`Erro ao processar resposta: ${jsonError.message}`)
      }

      console.info("[RedisStatusMonitor] Resposta recebida:", data)

      setDetails(data)

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

      setLastCheckTime(new Date().toLocaleTimeString())

      // Notificar o usuário sobre o status
      if (data.connected) {
        toast({
          title: "Redis conectado",
          description: "A conexão com o Redis está funcionando corretamente.",
          variant: "default",
        })
      } else if (data.degraded) {
        toast({
          title: "Redis em modo degradado",
          description: data.message || "Redis está operando com funcionalidade limitada.",
          variant: "warning",
        })
      } else if (!data.configured) {
        toast({
          title: "Redis não configurado",
          description: "As variáveis de ambiente do Redis não estão configuradas corretamente.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Erro de conexão",
          description: data.error || "Não foi possível conectar ao Redis.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[RedisStatusMonitor] Erro ao verificar conexão com Redis:", error)
      setStatus("error")
      setErrorMessage(error.message)
      setLastCheckTime(new Date().toLocaleTimeString())
      setProgress(100)

      toast({
        title: "Erro de conexão",
        description: error.message || "Não foi possível verificar a conexão com o Redis.",
        variant: "destructive",
      })

      // Se o auto-retry estiver ativado e o número de tentativas for menor que 3
      if (autoRetry && retryCount < 3) {
        toast({
          title: "Tentando novamente",
          description: `Tentativa ${retryCount + 1} de 3...`,
          variant: "default",
        })

        setTimeout(() => {
          setRetryCount((prev) => prev + 1)
        }, 5000) // Tentar novamente após 5 segundos
      }
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    // Usar um timeout para evitar problemas de hidratação
    const timer = setTimeout(() => {
      checkRedisConnection()
    }, 100)

    // Limpar intervalos e timeouts ao desmontar o componente
    return () => {
      clearTimeout(timer)
      setAutoRetry(false)
    }
  }, [retryCount])

  const handleRetry = () => {
    setRetryCount(0)
    checkRedisConnection()
  }

  const toggleAutoRetry = () => {
    setAutoRetry(!autoRetry)
    if (!autoRetry) {
      toast({
        title: "Auto-retry ativado",
        description: "O sistema tentará reconectar automaticamente ao Redis.",
        variant: "default",
      })
    }
  }

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
    degraded: {
      color: "bg-yellow-100 text-yellow-800",
      icon: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
      title: "Modo Degradado",
      description: errorMessage || "Redis está operando com funcionalidade limitada.",
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
    <Card className="shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <CardTitle className="text-xl">Status do Redis</CardTitle>
          </div>
          <Badge
            className={
              status === "connected"
                ? "bg-green-100 text-green-800"
                : status === "degraded"
                  ? "bg-yellow-100 text-yellow-800"
                  : status === "error"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800"
            }
          >
            {status === "connected"
              ? "Conectado"
              : status === "degraded"
                ? "Degradado"
                : status === "error"
                  ? "Erro"
                  : status === "not-configured"
                    ? "Não Configurado"
                    : "Verificando"}
          </Badge>
        </div>
        <CardDescription>
          Monitoramento da conexão com o Redis
          {lastCheckTime && <span className="ml-2 text-xs text-gray-500">Última verificação: {lastCheckTime}</span>}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="details">Detalhes</TabsTrigger>
          </TabsList>

          <TabsContent value="status">
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

            {status === "error" && (
              <div className="mt-4 space-y-2">
                <Alert variant="destructive">
                  <AlertTitle className="flex items-center gap-2">
                    <ServerOff className="h-4 w-4" />
                    Falha na conexão
                  </AlertTitle>
                  <AlertDescription>
                    <p className="mb-2">
                      O sistema não conseguiu se conectar ao Redis. Isso pode afetar algumas funcionalidades como:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      <li>Armazenamento de agendamentos</li>
                      <li>Cache de produtos e descrições</li>
                      <li>Rastreamento de vídeos publicados</li>
                    </ul>
                    <p className="mt-2">O sistema está operando em modo de fallback com dados simulados.</p>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {status === "degraded" && (
              <div className="mt-4">
                <Alert variant="warning" className="bg-yellow-50 border-yellow-200">
                  <AlertTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    Modo de Compatibilidade
                  </AlertTitle>
                  <AlertDescription className="text-yellow-700">
                    <p className="mb-2">
                      O Redis está operando em modo degradado. Algumas funcionalidades podem estar limitadas:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      <li>Dados podem não persistir entre sessões</li>
                      <li>Operações de cache podem ser mais lentas</li>
                      <li>Algumas funcionalidades avançadas podem estar indisponíveis</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </TabsContent>

          <TabsContent value="details">
            {details && status !== "loading" && (
              <div className="space-y-4">
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
                          : details.degraded
                            ? "bg-yellow-100 text-yellow-800"
                            : details.configured
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                      }
                    >
                      {details.connected
                        ? "Conectado"
                        : details.degraded
                          ? "Degradado"
                          : details.configured
                            ? "Falha"
                            : "Não configurado"}
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

                  {details.mode && (
                    <>
                      <div className="text-sm font-medium">Modo de operação:</div>
                      <div className="text-sm">{details.mode}</div>
                    </>
                  )}

                  {details.version && (
                    <>
                      <div className="text-sm font-medium">Versão do Redis:</div>
                      <div className="text-sm">{details.version}</div>
                    </>
                  )}

                  {details.memory && (
                    <>
                      <div className="text-sm font-medium">Uso de memória:</div>
                      <div className="text-sm">{details.memory}</div>
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

            {!details && status !== "loading" && (
              <div className="text-center py-4 text-muted-foreground">
                <p>Nenhum detalhe disponível</p>
                <Button variant="outline" size="sm" onClick={handleRetry} className="mt-2">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Verificar novamente
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter className="flex flex-col gap-2">
        <div className="flex gap-2 w-full">
          <Button variant="outline" size="sm" className="flex-1" onClick={handleRetry} disabled={isChecking}>
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

          <Button variant={autoRetry ? "default" : "outline"} size="sm" className="flex-1" onClick={toggleAutoRetry}>
            <Clock className="mr-2 h-4 w-4" />
            {autoRetry ? "Desativar Auto-retry" : "Ativar Auto-retry"}
          </Button>
        </div>

        <Button variant="outline" size="sm" asChild>
          <Link href="/diagnostics/redis">
            <Settings className="mr-2 h-4 w-4" />
            Diagnóstico Avançado
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
