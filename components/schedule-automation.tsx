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
import { CalendarIcon, Clock, Plus, Trash2, Loader2, Play, Pause, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"

export function ScheduleAutomation() {
  const [date, setDate] = useState<Date>()
  const [time, setTime] = useState("12:00")
  const [frequency, setFrequency] = useState("once")
  const [schedules, setSchedules] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoPublish, setAutoPublish] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [apiStatus, setApiStatus] = useState<"loading" | "error" | "success">("loading")
  const { toast } = useToast()

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

  const toggleAutomation = () => {
    setIsRunning(!isRunning)

    toast({
      title: isRunning ? "Automação pausada" : "Automação iniciada",
      description: isRunning
        ? "A automação foi pausada e não executará novos agendamentos"
        : "A automação foi iniciada e executará os agendamentos conforme programado",
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Novo Agendamento</CardTitle>
            <CardDescription>Agende a geração e publicação automática de vídeos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Selecione uma data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Horário</Label>
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Frequência</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger>
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
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Agendamento
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
                <p className="text-sm text-muted-foreground">Publicar automaticamente os vídeos gerados no TikTok</p>
              </div>
              <Switch id="auto-publish" checked={autoPublish} onCheckedChange={setAutoPublish} />
            </div>

            <div className="pt-4">
              <Alert>
                <AlertDescription>
                  A automação executará os agendamentos conforme programado e gerará vídeos automaticamente.
                  {autoPublish && " Os vídeos serão publicados automaticamente no TikTok."}
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={toggleAutomation}
              variant={isRunning ? "destructive" : "default"}
              className="w-full"
              disabled={apiStatus === "error"}
            >
              {isRunning ? (
                <>
                  <Pause className="mr-2 h-4 w-4" />
                  Pausar Automação
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Iniciar Automação
                </>
              )}
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
                  <TableHead>Status</TableHead>
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
                    <TableCell className="capitalize">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          schedule.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : schedule.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {schedule.status === "pending"
                          ? "Pendente"
                          : schedule.status === "completed"
                            ? "Concluído"
                            : schedule.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSchedule(schedule.id)}
                        disabled={isDeleting}
                      >
                        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
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
    </div>
  )
}
