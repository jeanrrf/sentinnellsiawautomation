"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import {
  CalendarIcon,
  Clock,
  Plus,
  Trash2,
  Loader2,
  Play,
  Pause,
  AlertTriangle,
  RefreshCw,
  Download,
  Info,
  FileDown,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Schedule {
  id: string
  date: string
  time: string
  frequency: string
  status: string
  type?: string
  lastRun?: string
  productCount?: number
  generatedCards?: string[]
  errors?: string[]
}

export function ScheduleAutomation() {
  const [date, setDate] = useState<Date>()
  const [time, setTime] = useState("12:00")
  const [frequency, setFrequency] = useState("once")
  const [scheduleType, setScheduleType] = useState("auto-download") // Alterado para auto-download por padrão
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDownloading, setIsDownloading] = useState<string | null>(null)
  const [isResetting, setIsResetting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [autoPublish, setAutoPublish] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [apiStatus, setApiStatus] = useState<"loading" | "error" | "success">("loading")
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("create")
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchSchedules()
  }, [])

  const fetchSchedules = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setApiStatus("loading")

      const response = await fetch("/api/schedule")

      if (!response.ok) {
        throw new Error(`Failed to fetch schedules: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      setSchedules(data.schedules || [])

      // Verificar se há mensagem de ambiente simulado
      if (data.message && data.message.includes("simulados")) {
        toast({
          title: "Modo simulado",
          description: data.message,
          variant: "default",
        })
      }

      setApiStatus("success")
    } catch (err: any) {
      setError(err.message || "Failed to fetch schedules")
      console.error("Error fetching schedules:", err)
      setApiStatus("error")

      // Definir schedules como array vazio em caso de erro
      setSchedules([])

      toast({
        variant: "destructive",
        title: "Erro ao carregar agendamentos",
        description: err.message || "Não foi possível carregar os agendamentos",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddSchedule = async () => {
    if (!date) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Selecione uma data para o agendamento",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: format(date, "yyyy-MM-dd"),
          time,
          frequency,
          type: scheduleType, // Incluir o tipo de agendamento
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to create schedule: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Agendamento criado",
          description: "O agendamento foi criado com sucesso",
        })

        // Reset form
        setDate(undefined)
        setTime("12:00")
        setFrequency("once")
        setScheduleType("auto-download") // Manter auto-download como padrão

        // Refresh schedules
        fetchSchedules()

        // Verificar se há mensagem de ambiente simulado
        if (data.message && data.message.includes("simulados")) {
          toast({
            title: "Modo simulado",
            description: data.message,
            variant: "default",
          })
        }
      } else {
        throw new Error(data.message || "Failed to create schedule")
      }
    } catch (err: any) {
      setError(err.message || "Failed to create schedule")
      console.error("Error creating schedule:", err)
      toast({
        variant: "destructive",
        title: "Erro",
        description: err.message || "Erro ao criar agendamento",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteSchedule = async (id: string) => {
    setIsDeleting(true)

    try {
      const response = await fetch("/api/schedule", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      })

      if (!response.ok) {
        throw new Error(`Failed to delete schedule: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Agendamento excluído",
          description: "O agendamento foi excluído com sucesso",
        })

        // Refresh schedules
        fetchSchedules()

        // Verificar se há mensagem de ambiente simulado
        if (data.message && data.message.includes("simulados")) {
          toast({
            title: "Modo simulado",
            description: data.message,
            variant: "default",
          })
        }
      } else {
        throw new Error(data.message || "Failed to delete schedule")
      }
    } catch (err: any) {
      setError(err.message || "Failed to delete schedule")
      console.error("Error deleting schedule:", err)
      toast({
        variant: "destructive",
        title: "Erro",
        description: err.message || "Erro ao excluir agendamento",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleResetSchedule = async (id: string) => {
    setIsResetting(id)

    try {
      const response = await fetch("/api/schedule", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, action: "reset" }),
      })

      if (!response.ok) {
        throw new Error(`Failed to reset schedule: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Agendamento reiniciado",
          description: "O agendamento foi reiniciado com sucesso",
        })

        // Refresh schedules
        fetchSchedules()
      } else {
        throw new Error(data.message || "Failed to reset schedule")
      }
    } catch (err: any) {
      setError(err.message || "Failed to reset schedule")
      console.error("Error resetting schedule:", err)
      toast({
        variant: "destructive",
        title: "Erro",
        description: err.message || "Erro ao reiniciar agendamento",
      })
    } finally {
      setIsResetting(null)
    }
  }

  const handleDownloadCard = async (id: string) => {
    setIsDownloading(id)
    setDownloadError(null)

    try {
      // First, get the card path
      const response = await fetch("/api/schedule", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, action: "download" }),
      })

      if (!response.ok) {
        throw new Error(`Failed to get card path: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success && data.cardPath) {
        // Usar iframe para download em vez de redirecionamento
        const iframe = document.createElement("iframe")
        iframe.style.display = "none"
        iframe.src = `/api/download-card?path=${encodeURIComponent(data.cardPath)}`
        document.body.appendChild(iframe)

        // Remover o iframe após alguns segundos
        setTimeout(() => {
          document.body.removeChild(iframe)
        }, 5000)

        toast({
          title: "Download iniciado",
          description: `O download do card ${data.fileName} foi iniciado`,
        })
      } else {
        throw new Error(data.message || "Failed to get card path")
      }
    } catch (err: any) {
      setDownloadError(err.message || "Failed to download card")
      console.error("Error downloading card:", err)
      toast({
        variant: "destructive",
        title: "Erro",
        description: err.message || "Erro ao baixar card",
      })
    } finally {
      setIsDownloading(null)
    }
  }

  const handleRunNow = async (id: string) => {
    const schedule = schedules.find((s) => s.id === id)
    if (!schedule) return

    setIsDownloading(id)
    setDownloadError(null)

    try {
      // Sempre usar a nova API aprimorada para download automático
      window.open("/api/enhanced-auto-download", "_blank")

      toast({
        title: "Download iniciado",
        description: "O download automático foi iniciado em uma nova aba",
      })
    } catch (err: any) {
      setDownloadError(err.message || "Failed to run schedule")
      console.error("Error running schedule:", err)
      toast({
        variant: "destructive",
        title: "Erro",
        description: err.message || "Erro ao executar agendamento",
      })
    } finally {
      setIsDownloading(null)
    }
  }

  const toggleAutomation = () => {
    setIsRunning(!isRunning)

    toast({
      title: isRunning ? "Automação pausada" : "Automação iniciada",
      description: isRunning
        ? "A automação foi pausada e não executará novos agendamentos"
        : "A automação foi iniciada e executará os agendamentos conforme programado",
    })
  }

  const formatScheduleStatus = (schedule: Schedule) => {
    if (schedule.status === "completed") {
      if (schedule.generatedCards && schedule.generatedCards.length > 0) {
        return (
          <Badge variant="success" className="bg-green-100 text-green-800">
            Concluído com {schedule.generatedCards.length} card(s)
          </Badge>
        )
      } else {
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800">
            Concluído com erros
          </Badge>
        )
      }
    } else if (schedule.status === "pending") {
      return (
        <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
          Pendente
        </Badge>
      )
    } else {
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          {schedule.status}
        </Badge>
      )
    }
  }

  const formatScheduleType = (schedule: Schedule) => {
    if (schedule.type === "auto-download") {
      return (
        <Badge variant="outline" className="bg-purple-100 text-purple-800">
          Download Automático
        </Badge>
      )
    } else {
      return (
        <Badge variant="outline" className="bg-blue-100 text-blue-800">
          Geração Padrão
        </Badge>
      )
    }
  }

  const showScheduleDetails = (schedule: Schedule) => {
    setSelectedSchedule(schedule)
  }

  const handleGoToDownloads = () => {
    router.push("/dashboard/downloads")
  }

  const handleRunAutoDownload = () => {
    window.open("/api/enhanced-auto-download", "_blank")

    toast({
      title: "Download iniciado",
      description: "O download automático foi iniciado em uma nova aba",
    })
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {apiStatus === "error" && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro na API</AlertTitle>
          <AlertDescription>
            Não foi possível conectar à API de agendamentos. O sistema está operando em modo simulado.
          </AlertDescription>
        </Alert>
      )}

      {downloadError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro no Download</AlertTitle>
          <AlertDescription>
            {downloadError}
            <div className="mt-2">
              <Button variant="outline" size="sm" onClick={handleGoToDownloads}>
                <FileDown className="mr-2 h-4 w-4" />
                Ir para página de downloads
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 mb-6">
          <TabsTrigger value="create">Criar Agendamento</TabsTrigger>
          <TabsTrigger value="run">Executar Agora</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Novo Agendamento</CardTitle>
                <CardDescription>Agende a geração e publicação automática de cards</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="schedule-type">Tipo de Agendamento</Label>
                  <Select value={scheduleType} onValueChange={setScheduleType}>
                    <SelectTrigger id="schedule-type" aria-label="Selecione o tipo de agendamento">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto-download">Download Automático</SelectItem>
                      <SelectItem value="regular">Geração Padrão</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {scheduleType === "auto-download"
                      ? "Gera e baixa cards com todos os templates disponíveis automaticamente"
                      : "Gera cards usando o fluxo padrão de geração"}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schedule-date">Data</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="schedule-date"
                        variant={"outline"}
                        className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                        aria-label="Selecione uma data"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Selecione uma data</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                        aria-label="Calendário para seleção de data"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schedule-time">Horário</Label>
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="schedule-time"
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      aria-label="Selecione o horário"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schedule-frequency">Frequência</Label>
                  <Select value={frequency} onValueChange={setFrequency}>
                    <SelectTrigger id="schedule-frequency" aria-label="Selecione a frequência">
                      <SelectValue placeholder="Selecione a frequência" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="once">Uma vez</SelectItem>
                      <SelectItem value="daily">Diariamente</SelectItem>
                      <SelectItem value="weekly">Semanalmente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleAddSchedule}
                  disabled={!date || isSubmitting || apiStatus === "error"}
                  className="w-full"
                  aria-label="Adicionar agendamento"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Criando...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      <span>Adicionar Agendamento</span>
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configurações de Automação</CardTitle>
                <CardDescription>Configure como a automação deve funcionar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-publish">Publicação Automática</Label>
                    <p className="text-sm text-muted-foreground">Publicar automaticamente os cards gerados no TikTok</p>
                  </div>
                  <Switch
                    id="auto-publish"
                    checked={autoPublish}
                    onCheckedChange={setAutoPublish}
                    aria-label="Ativar publicação automática"
                  />
                </div>

                <div className="pt-4">
                  <Alert>
                    <AlertDescription>
                      A automação executará os agendamentos conforme programado e gerará cards automaticamente.
                      {autoPublish && " Os cards serão publicados automaticamente no TikTok."}
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <Button
                  onClick={toggleAutomation}
                  variant={isRunning ? "destructive" : "default"}
                  className="w-full"
                  disabled={apiStatus === "error"}
                  aria-label={isRunning ? "Pausar automação" : "Iniciar automação"}
                >
                  {isRunning ? (
                    <>
                      <Pause className="mr-2 h-4 w-4" />
                      <span>Pausar Automação</span>
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      <span>Iniciar Automação</span>
                    </>
                  )}
                </Button>

                {/* Botão para ir para a página de downloads */}
                <Button
                  onClick={handleGoToDownloads}
                  variant="outline"
                  className="w-full"
                  aria-label="Gerenciar downloads"
                >
                  <Download className="mr-2 h-4 w-4" />
                  <span>Gerenciar Downloads</span>
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status da Automação</CardTitle>
                <CardDescription>Informações sobre o status atual da automação</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className={`font-medium ${isRunning ? "text-green-500" : "text-yellow-500"}`}>
                      {isRunning ? "Em execução" : "Pausado"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Agendamentos:</span>
                    <span className="font-medium">{schedules.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Próxima execução:</span>
                    <span className="font-medium">
                      {schedules.length > 0 ? `${schedules[0].date} ${schedules[0].time}` : "Nenhum agendamento"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Publicação automática:</span>
                    <span className={`font-medium ${autoPublish ? "text-green-500" : "text-yellow-500"}`}>
                      {autoPublish ? "Ativada" : "Desativada"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>API:</span>
                    <span
                      className={`font-medium ${
                        apiStatus === "success"
                          ? "text-green-500"
                          : apiStatus === "error"
                            ? "text-red-500"
                            : "text-yellow-500"
                      }`}
                    >
                      {apiStatus === "success" ? "Conectada" : apiStatus === "error" ? "Erro" : "Carregando..."}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="run" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Executar Download Automático</CardTitle>
                <CardDescription>Gere e baixe cards de produtos automaticamente com apenas um clique</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-md">
                  <h3 className="font-medium text-blue-800 mb-2">Versão Aprimorada:</h3>
                  <ul className="list-disc pl-5 space-y-1 text-blue-700 text-sm">
                    <li>Seleciona automaticamente um produto do cache (ou usa um exemplo se não houver produtos)</li>
                    <li>
                      Gera cards usando <strong>todos os modelos disponíveis</strong> (Modern, Elegant, Bold, etc.)
                    </li>
                    <li>Cria uma descrição otimizada para SEO e conversão</li>
                    <li>Empacota tudo em um arquivo ZIP para download</li>
                    <li>Executa todo o processo com apenas um clique</li>
                  </ul>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleRunAutoDownload} className="w-full" size="lg">
                  <Zap className="mr-2 h-5 w-5" />
                  Executar Download Automático
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Executar Agendamento Existente</CardTitle>
                <CardDescription>
                  Execute um agendamento existente imediatamente sem esperar pela data programada
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-md">
                  <h3 className="font-medium text-blue-800 mb-2">Como funciona?</h3>
                  <ul className="list-disc pl-5 space-y-1 text-blue-700 text-sm">
                    <li>Selecione um agendamento da lista abaixo</li>
                    <li>Clique em "Executar Agora" para iniciar o processo imediatamente</li>
                    <li>Para agendamentos de download automático, uma nova aba será aberta</li>
                    <li>Para agendamentos padrão, o download será iniciado automaticamente</li>
                  </ul>
                </div>

                {schedules.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {schedules.map((schedule) => (
                      <div key={schedule.id} className="flex items-center justify-between p-3 border rounded-md">
                        <div>
                          <div className="font-medium">
                            {schedule.date} {schedule.time}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                            {formatScheduleType(schedule)}
                            {formatScheduleStatus(schedule)}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleRunNow(schedule.id)}
                          disabled={isDownloading === schedule.id}
                        >
                          {isDownloading === schedule.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum agendamento encontrado. Crie um agendamento primeiro.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Agendamentos</CardTitle>
          <CardDescription>Lista de todos os agendamentos programados</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : schedules.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Frequência</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Última Execução</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell>{schedule.date}</TableCell>
                    <TableCell>{schedule.time}</TableCell>
                    <TableCell className="capitalize">
                      {schedule.frequency === "once"
                        ? "Uma vez"
                        : schedule.frequency === "daily"
                          ? "Diariamente"
                          : "Semanalmente"}
                    </TableCell>
                    <TableCell>{formatScheduleType(schedule)}</TableCell>
                    <TableCell className="capitalize">{formatScheduleStatus(schedule)}</TableCell>
                    <TableCell>{schedule.lastRun ? new Date(schedule.lastRun).toLocaleString() : "Nunca"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRunNow(schedule.id)}
                          disabled={isDownloading === schedule.id}
                          aria-label="Executar agora"
                        >
                          {isDownloading === schedule.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>

                        {schedule.generatedCards && schedule.generatedCards.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadCard(schedule.id)}
                            disabled={isDownloading === schedule.id}
                            aria-label="Baixar card"
                          >
                            {isDownloading === schedule.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => showScheduleDetails(schedule)}
                          aria-label="Ver detalhes"
                        >
                          <Info className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResetSchedule(schedule.id)}
                          disabled={isResetting === schedule.id}
                          aria-label="Reiniciar agendamento"
                        >
                          {isResetting === schedule.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSchedule(schedule.id)}
                          disabled={isDeleting}
                          aria-label={`Excluir agendamento de ${schedule.date}`}
                        >
                          {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum agendamento encontrado</p>
              <p className="text-sm text-muted-foreground mt-2">
                {apiStatus === "error"
                  ? "A API de agendamentos está indisponível no momento"
                  : "Crie um novo agendamento usando o formulário ao lado"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule Details Dialog */}
      {selectedSchedule && (
        <AlertDialog open={!!selectedSchedule} onOpenChange={(open) => !open && setSelectedSchedule(null)}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>Detalhes do Agendamento</AlertDialogTitle>
              <AlertDialogDescription>Informações detalhadas sobre o agendamento</AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm font-medium">ID:</div>
                <div className="text-sm">{selectedSchedule.id}</div>

                <div className="text-sm font-medium">Data:</div>
                <div className="text-sm">{selectedSchedule.date}</div>

                <div className="text-sm font-medium">Horário:</div>
                <div className="text-sm">{selectedSchedule.time}</div>

                <div className="text-sm font-medium">Frequência:</div>
                <div className="text-sm capitalize">
                  {selectedSchedule.frequency === "once"
                    ? "Uma vez"
                    : selectedSchedule.frequency === "daily"
                      ? "Diariamente"
                      : "Semanalmente"}
                </div>

                <div className="text-sm font-medium">Tipo:</div>
                <div className="text-sm">
                  {selectedSchedule.type === "auto-download" ? "Download Automático" : "Geração Padrão"}
                </div>

                <div className="text-sm font-medium">Status:</div>
                <div className="text-sm">{formatScheduleStatus(selectedSchedule)}</div>

                <div className="text-sm font-medium">Última Execução:</div>
                <div className="text-sm">
                  {selectedSchedule.lastRun ? new Date(selectedSchedule.lastRun).toLocaleString() : "Nunca"}
                </div>

                <div className="text-sm font-medium">Produtos Processados:</div>
                <div className="text-sm">{selectedSchedule.productCount || 0}</div>

                <div className="text-sm font-medium">Cards Gerados:</div>
                <div className="text-sm">{selectedSchedule.generatedCards?.length || 0}</div>
              </div>

              {selectedSchedule.errors && selectedSchedule.errors.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Erros:</h4>
                  <div className="bg-red-50 p-3 rounded-md text-sm text-red-800 max-h-32 overflow-y-auto">
                    <ul className="list-disc pl-5 space-y-1">
                      {selectedSchedule.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {selectedSchedule.generatedCards && selectedSchedule.generatedCards.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Cards Gerados:</h4>
                  <div className="bg-green-50 p-3 rounded-md text-sm text-green-800 max-h-32 overflow-y-auto">
                    <ul className="list-disc pl-5 space-y-1">
                      {selectedSchedule.generatedCards.map((card, index) => (
                        <li key={index}>{card}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            <AlertDialogFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setSelectedSchedule(null)}>
                Fechar
              </Button>

              {selectedSchedule.generatedCards && selectedSchedule.generatedCards.length > 0 && (
                <Button
                  onClick={() => {
                    handleDownloadCard(selectedSchedule.id)
                    setSelectedSchedule(null)
                  }}
                  disabled={isDownloading === selectedSchedule.id}
                >
                  {isDownloading === selectedSchedule.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Baixando...</span>
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      <span>Baixar Card</span>
                    </>
                  )}
                </Button>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
