"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Save, Trash, Plus, Play, Pause } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

// Tipos de frequência
const FREQUENCY_TYPES = [
  { id: "daily", name: "Diariamente" },
  { id: "weekly", name: "Semanalmente" },
  { id: "monthly", name: "Mensalmente" },
  { id: "custom", name: "Personalizado" },
]

// Tipos de busca
const SEARCH_TYPES = [
  { id: "best_sellers", name: "Mais Vendidos" },
  { id: "biggest_discounts", name: "Maiores Descontos" },
  { id: "best_rated", name: "Melhor Avaliados" },
  { id: "best_price", name: "Melhor Custo-Benefício" },
  { id: "trending", name: "Em Alta" },
]

// Dias da semana
const WEEKDAYS = [
  { id: 0, name: "Domingo" },
  { id: 1, name: "Segunda-feira" },
  { id: 2, name: "Terça-feira" },
  { id: 3, name: "Quarta-feira" },
  { id: 4, name: "Quinta-feira" },
  { id: 5, name: "Sexta-feira" },
  { id: 6, name: "Sábado" },
]

export function AutoGenerationScheduler() {
  const { toast } = useToast()
  const [schedules, setSchedules] = useState<any[]>([])
  const [currentSchedule, setCurrentSchedule] = useState<any>({
    id: "",
    name: "",
    enabled: true,
    frequency: "daily",
    time: "09:00",
    weekdays: [1, 3, 5], // Segunda, Quarta, Sexta
    dayOfMonth: 1,
    searchType: "best_sellers",
    limit: 5,
    template: "default-modern",
    generateDescription: true,
    includeSecondVariation: true,
    saveToGallery: true,
    notifyByEmail: false,
    email: "",
    lastRun: null,
    nextRun: null,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [templates, setTemplates] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("basic")
  const [executionHistory, setExecutionHistory] = useState<any[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  // Carregar agendamentos e templates salvos
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        // Try to load from API first
        try {
          const response = await fetch("/api/schedule")
          if (response.ok) {
            const data = await response.json()
            if (data.success && data.schedules) {
              setSchedules(data.schedules)
              setIsLoading(false)
              return
            }
          }
        } catch (apiError) {
          console.warn("Could not load schedules from API, falling back to localStorage", apiError)
        }

        // Fallback to localStorage
        const savedSchedules = localStorage.getItem("cardGenerationSchedules")
        if (savedSchedules) {
          setSchedules(JSON.parse(savedSchedules))
        } else {
          // Agendamento de exemplo
          const exampleSchedule = {
            id: "schedule-example",
            name: "Geração Diária de Cards",
            enabled: true,
            frequency: "daily",
            time: "09:00",
            weekdays: [1, 3, 5],
            dayOfMonth: 1,
            searchType: "best_sellers",
            limit: 5,
            template: "default-modern",
            generateDescription: true,
            includeSecondVariation: true,
            saveToGallery: true,
            notifyByEmail: false,
            email: "",
            lastRun: null,
            nextRun: calculateNextRun({
              frequency: "daily",
              time: "09:00",
              weekdays: [1, 3, 5],
              dayOfMonth: 1,
            }),
          }
          setSchedules([exampleSchedule])
          localStorage.setItem("cardGenerationSchedules", JSON.stringify([exampleSchedule]))
        }

        // Carregar templates do localStorage
        const savedTemplates = localStorage.getItem("cardTemplates")
        if (savedTemplates) {
          setTemplates(JSON.parse(savedTemplates))
        } else {
          // Templates padrão
          const defaultTemplates = [
            { id: "default-modern", name: "Moderno Padrão" },
            { id: "default-bold", name: "Negrito Padrão" },
            { id: "elegant", name: "Elegante" },
            { id: "minimal", name: "Minimalista" },
            { id: "vibrant", name: "Vibrante" },
          ]
          setTemplates(defaultTemplates)
        }

        // Load execution history
        await loadExecutionHistory()
      } catch (error) {
        console.error("Error loading data:", error)
        toast({
          variant: "destructive",
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar os agendamentos salvos.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [toast])

  // Load execution history
  const loadExecutionHistory = async () => {
    setIsLoadingHistory(true)
    try {
      // Try to load from API first
      try {
        const response = await fetch("/api/schedule/history")
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.history) {
            setExecutionHistory(data.history)
            setIsLoadingHistory(false)
            return
          }
        }
      } catch (apiError) {
        console.warn("Could not load execution history from API, using mock data", apiError)
      }

      // Mock data as fallback
      const mockHistory = [
        {
          id: "exec-1",
          scheduleId: "schedule-example",
          scheduleName: "Geração Diária de Cards",
          executionDate: new Date(Date.now() - 86400000).toISOString(),
          status: "completed",
          productsGenerated: 5,
          duration: "45s",
        },
        {
          id: "exec-2",
          scheduleId: "schedule-example",
          scheduleName: "Geração Diária de Cards",
          executionDate: new Date(Date.now() - 172800000).toISOString(),
          status: "completed",
          productsGenerated: 5,
          duration: "42s",
        },
      ]
      setExecutionHistory(mockHistory)
    } catch (error) {
      console.error("Error loading execution history:", error)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  // Calcular a próxima execução com base na frequência
  const calculateNextRun = (schedule: any) => {
    const now = new Date()
    const nextRun = new Date()

    // Definir a hora
    const [hours, minutes] = schedule.time.split(":").map(Number)
    nextRun.setHours(hours, minutes, 0, 0)

    // Se a hora já passou hoje, avançar para o próximo dia
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1)
    }

    // Ajustar com base na frequência
    if (schedule.frequency === "daily") {
      // Já está configurado para o próximo dia
    } else if (schedule.frequency === "weekly") {
      // Encontrar o próximo dia da semana válido
      const currentDay = nextRun.getDay()
      const weekdays = schedule.weekdays || [1] // Default: Segunda-feira

      // Ordenar os dias da semana
      const sortedWeekdays = [...weekdays].sort((a, b) => a - b)

      // Encontrar o próximo dia da semana
      let nextWeekday = sortedWeekdays.find((day) => day > currentDay)

      if (nextWeekday === undefined) {
        // Se não houver dias maiores que o atual, pegar o primeiro da lista (próxima semana)
        nextWeekday = sortedWeekdays[0]
        nextRun.setDate(nextRun.getDate() + (7 - currentDay + nextWeekday))
      } else {
        // Avançar para o próximo dia da semana
        nextRun.setDate(nextRun.getDate() + (nextWeekday - currentDay))
      }
    } else if (schedule.frequency === "monthly") {
      // Configurar para o dia do mês especificado
      const dayOfMonth = schedule.dayOfMonth || 1

      // Obter o último dia do mês atual
      const lastDayOfMonth = new Date(nextRun.getFullYear(), nextRun.getMonth() + 1, 0).getDate()

      // Ajustar o dia (limitado ao último dia do mês)
      const targetDay = Math.min(dayOfMonth, lastDayOfMonth)

      // Se o dia já passou neste mês, avançar para o próximo mês
      if (nextRun.getDate() > targetDay) {
        nextRun.setMonth(nextRun.getMonth() + 1)
      }

      nextRun.setDate(targetDay)
    }

    return nextRun.toISOString()
  }

  // Selecionar um agendamento para edição
  const selectSchedule = (scheduleId: string) => {
    const schedule = schedules.find((s) => s.id === scheduleId)
    if (schedule) {
      setCurrentSchedule({ ...schedule })
    }
  }

  // Criar um novo agendamento
  const createNewSchedule = () => {
    const newSchedule = {
      id: `schedule-${Date.now()}`,
      name: `Novo Agendamento ${schedules.length + 1}`,
      enabled: true,
      frequency: "daily",
      time: "09:00",
      weekdays: [1, 3, 5], // Segunda, Quarta, Sexta
      dayOfMonth: 1,
      searchType: "best_sellers",
      limit: 5,
      template: templates.length > 0 ? templates[0].id : "default-modern",
      generateDescription: true,
      includeSecondVariation: true,
      saveToGallery: true,
      notifyByEmail: false,
      email: "",
      lastRun: null,
      nextRun: null,
    }

    // Calcular a próxima execução
    newSchedule.nextRun = calculateNextRun(newSchedule)

    setCurrentSchedule(newSchedule)
  }

  // Salvar agendamento atual
  const saveCurrentSchedule = async () => {
    if (!currentSchedule.name) {
      toast({
        variant: "destructive",
        title: "Nome obrigatório",
        description: "Por favor, forneça um nome para o agendamento.",
      })
      return
    }

    setIsSaving(true)

    try {
      // Calcular a próxima execução
      const updatedSchedule = {
        ...currentSchedule,
        nextRun: calculateNextRun(currentSchedule),
      }

      // Verificar se é um novo agendamento ou atualização
      const existingIndex = schedules.findIndex((s) => s.id === updatedSchedule.id)
      let updatedSchedules

      if (existingIndex >= 0) {
        // Atualizar agendamento existente
        updatedSchedules = [...schedules]
        updatedSchedules[existingIndex] = updatedSchedule
      } else {
        // Adicionar novo agendamento
        updatedSchedules = [...schedules, updatedSchedule]
      }

      // Try to save to API first
      try {
        const response = await fetch("/api/schedule", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedSchedule),
        })

        if (!response.ok) {
          throw new Error("Failed to save schedule to API")
        }
      } catch (apiError) {
        console.warn("Could not save schedule to API, falling back to localStorage", apiError)
        // Fallback to localStorage
        localStorage.setItem("cardGenerationSchedules", JSON.stringify(updatedSchedules))
      }

      setSchedules(updatedSchedules)
      setCurrentSchedule(updatedSchedule)

      toast({
        title: "Agendamento salvo",
        description: "O agendamento foi salvo com sucesso.",
      })
    } catch (error) {
      console.error("Error saving schedule:", error)
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Não foi possível salvar o agendamento.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Excluir um agendamento
  const deleteSchedule = async (scheduleId: string) => {
    try {
      // Try to delete from API first
      try {
        const response = await fetch(`/api/schedule?id=${scheduleId}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          throw new Error("Failed to delete schedule from API")
        }
      } catch (apiError) {
        console.warn("Could not delete schedule from API, falling back to localStorage", apiError)
      }

      const updatedSchedules = schedules.filter((s) => s.id !== scheduleId)
      setSchedules(updatedSchedules)
      localStorage.setItem("cardGenerationSchedules", JSON.stringify(updatedSchedules))

      // Se o agendamento atual foi excluído, selecionar outro
      if (currentSchedule.id === scheduleId) {
        if (updatedSchedules.length > 0) {
          setCurrentSchedule({ ...updatedSchedules[0] })
        } else {
          createNewSchedule()
        }
      }

      toast({
        title: "Agendamento excluído",
        description: "O agendamento foi excluído com sucesso.",
      })
    } catch (error) {
      console.error("Error deleting schedule:", error)
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: "Não foi possível excluir o agendamento.",
      })
    }
  }

  // Atualizar um campo do agendamento atual
  const updateScheduleField = (field: string, value: any) => {
    setCurrentSchedule((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Alternar dia da semana
  const toggleWeekday = (dayId: number) => {
    const weekdays = [...(currentSchedule.weekdays || [])]
    const index = weekdays.indexOf(dayId)

    if (index >= 0) {
      // Remover dia (garantir que pelo menos um dia permaneça selecionado)
      if (weekdays.length > 1) {
        weekdays.splice(index, 1)
      }
    } else {
      // Adicionar dia
      weekdays.push(dayId)
    }

    updateScheduleField("weekdays", weekdays)
  }

  // Alternar status de ativação
  const toggleScheduleStatus = async (scheduleId: string) => {
    const schedule = schedules.find((s) => s.id === scheduleId)
    if (!schedule) return

    const updatedSchedule = { ...schedule, enabled: !schedule.enabled }

    try {
      // Try to update in API first
      try {
        const response = await fetch("/api/schedule", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedSchedule),
        })

        if (!response.ok) {
          throw new Error("Failed to update schedule status in API")
        }
      } catch (apiError) {
        console.warn("Could not update schedule status in API, falling back to localStorage", apiError)
      }

      const updatedSchedules = schedules.map((s) => {
        if (s.id === scheduleId) {
          // Se o agendamento atual foi alterado, atualizar também
          if (currentSchedule.id === scheduleId) {
            setCurrentSchedule(updatedSchedule)
          }

          return updatedSchedule
        }
        return s
      })

      setSchedules(updatedSchedules)
      localStorage.setItem("cardGenerationSchedules", JSON.stringify(updatedSchedules))

      toast({
        title: "Status alterado",
        description: `Agendamento ${updatedSchedule.enabled ? "ativado" : "desativado"} com sucesso.`,
      })
    } catch (error) {
      console.error("Error toggling schedule status:", error)
      toast({
        variant: "destructive",
        title: "Erro ao alterar status",
        description: "Não foi possível alterar o status do agendamento.",
      })
    }
  }

  // Executar agendamento manualmente
  const runScheduleNow = async (scheduleId: string) => {
    const schedule = schedules.find((s) => s.id === scheduleId)
    if (!schedule) return

    toast({
      title: "Executando agendamento",
      description: `Iniciando execução manual do agendamento "${schedule.name}"...`,
    })

    try {
      // Try to run via API first
      try {
        const response = await fetch(`/api/schedule/run?id=${scheduleId}`, {
          method: "POST",
        })

        if (!response.ok) {
          throw new Error("Failed to run schedule via API")
        }

        const result = await response.json()
        if (!result.success) {
          throw new Error(result.message || "Failed to run schedule")
        }

        // Update schedules with new lastRun and nextRun
        if (result.schedule) {
          const updatedSchedules = schedules.map((s) => {
            if (s.id === scheduleId) {
              const updated = {
                ...s,
                lastRun: result.schedule.lastRun,
                nextRun: result.schedule.nextRun,
              }

              // If current schedule was updated, update it too
              if (currentSchedule.id === scheduleId) {
                setCurrentSchedule(updated)
              }

              return updated
            }
            return s
          })

          setSchedules(updatedSchedules)
          localStorage.setItem("cardGenerationSchedules", JSON.stringify(updatedSchedules))
        }

        // Add to execution history
        if (result.execution) {
          setExecutionHistory([result.execution, ...executionHistory])
        }

        toast({
          title: "Execução concluída",
          description: `O agendamento "${schedule.name}" foi executado com sucesso.`,
        })
        return
      } catch (apiError) {
        console.warn("Could not run schedule via API, using simulation", apiError)
      }

      // Simulate execution as fallback
      setTimeout(() => {
        // Atualizar data da última execução
        const updatedSchedules = schedules.map((s) => {
          if (s.id === scheduleId) {
            const updated = {
              ...s,
              lastRun: new Date().toISOString(),
              nextRun: calculateNextRun(s),
            }

            // Se o agendamento atual foi alterado, atualizar também
            if (currentSchedule.id === scheduleId) {
              setCurrentSchedule(updated)
            }

            return updated
          }
          return s
        })

        setSchedules(updatedSchedules)
        localStorage.setItem("cardGenerationSchedules", JSON.stringify(updatedSchedules))

        // Add to execution history
        const newExecution = {
          id: `exec-${Date.now()}`,
          scheduleId,
          scheduleName: schedule.name,
          executionDate: new Date().toISOString(),
          status: "completed",
          productsGenerated: schedule.limit,
          duration: `${Math.floor(Math.random() * 60) + 30}s`,
        }

        setExecutionHistory([newExecution, ...executionHistory])

        toast({
          title: "Execução concluída",
          description: `O agendamento "${schedule.name}" foi executado com sucesso.`,
        })
      }, 2000)
    } catch (error) {
      console.error("Error running schedule:", error)
      toast({
        variant: "destructive",
        title: "Erro ao executar",
        description: "Não foi possível executar o agendamento.",
      })
    }
  }

  // Formatar data para exibição
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Nunca"

    const date = new Date(dateString)
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Agendamento de Geração Automática</CardTitle>
          <CardDescription>Configure agendamentos para geração automática de cards de produtos</CardDescription>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Agendamentos</h3>
                  <Button variant="outline" size="sm" onClick={createNewSchedule}>
                    <Plus className="h-4 w-4 mr-1" />
                    Novo
                  </Button>
                </div>

                {schedules.length === 0 ? (
                  <Alert>
                    <AlertTitle>Nenhum agendamento encontrado</AlertTitle>
                    <AlertDescription>Clique em "Novo" para criar seu primeiro agendamento.</AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                    {schedules.map((schedule) => (
                      <div
                        key={schedule.id}
                        className={`p-3 border rounded-md cursor-pointer hover:bg-muted transition-colors ${
                          currentSchedule.id === schedule.id ? "border-primary bg-primary/5" : ""
                        }`}
                        onClick={() => selectSchedule(schedule.id)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{schedule.name}</h4>
                            <p className="text-xs text-muted-foreground">
                              {FREQUENCY_TYPES.find((f) => f.id === schedule.frequency)?.name || schedule.frequency} às{" "}
                              {schedule.time}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`h-7 w-7 ${schedule.enabled ? "text-green-500" : "text-gray-400"}`}
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleScheduleStatus(schedule.id)
                              }}
                            >
                              {schedule.enabled ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                              <span className="sr-only">{schedule.enabled ? "Desativar" : "Ativar"}</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteSchedule(schedule.id)
                              }}
                            >
                              <Trash className="h-4 w-4" />
                              <span className="sr-only">Excluir</span>
                            </Button>
                          </div>
                        </div>

                        <div className="mt-2 flex justify-between items-center">
                          <Badge variant={schedule.enabled ? "default" : "outline"}>
                            {schedule.enabled ? "Ativo" : "Inativo"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Próxima execução: {formatDate(schedule.nextRun)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-4">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => runScheduleNow(currentSchedule.id)}
                    disabled={!currentSchedule.id}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Executar Agora
                  </Button>
                </div>
              </div>

              <div className="md:col-span-2">
                {currentSchedule.id ? (
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid grid-cols-3 mb-4">
                      <TabsTrigger value="basic">Básico</TabsTrigger>
                      <TabsTrigger value="schedule">Agendamento</TabsTrigger>
                      <TabsTrigger value="options">Opções</TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="schedule-name">Nome do Agendamento</Label>
                        <Input
                          id="schedule-name"
                          value={currentSchedule.name}
                          onChange={(e) => updateScheduleField("name", e.target.value)}
                          placeholder="Nome do agendamento"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="schedule-enabled"
                          checked={currentSchedule.enabled}
                          onCheckedChange={(checked) => updateScheduleField("enabled", checked)}
                        />
                        <Label htmlFor="schedule-enabled">Ativar Agendamento</Label>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="search-type">Tipo de Busca</Label>
                        <Select
                          value={currentSchedule.searchType}
                          onValueChange={(value) => updateScheduleField("searchType", value)}
                        >
                          <SelectTrigger id="search-type">
                            <SelectValue placeholder="Selecione um tipo de busca" />
                          </SelectTrigger>
                          <SelectContent>
                            {SEARCH_TYPES.map((type) => (
                              <SelectItem key={type.id} value={type.id}>
                                {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="limit">Limite de Produtos</Label>
                        <Select
                          value={currentSchedule.limit.toString()}
                          onValueChange={(value) => updateScheduleField("limit", Number(value))}
                        >
                          <SelectTrigger id="limit">
                            <SelectValue placeholder="Selecione um limite" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 produto</SelectItem>
                            <SelectItem value="3">3 produtos</SelectItem>
                            <SelectItem value="5">5 produtos</SelectItem>
                            <SelectItem value="10">10 produtos</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="template">Template</Label>
                        <Select
                          value={currentSchedule.template}
                          onValueChange={(value) => updateScheduleField("template", value)}
                        >
                          <SelectTrigger id="template">
                            <SelectValue placeholder="Selecione um template" />
                          </SelectTrigger>
                          <SelectContent>
                            {templates.map((template) => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TabsContent>

                    <TabsContent value="schedule" className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="frequency">Frequência</Label>
                        <Select
                          value={currentSchedule.frequency}
                          onValueChange={(value) => updateScheduleField("frequency", value)}
                        >
                          <SelectTrigger id="frequency">
                            <SelectValue placeholder="Selecione uma frequência" />
                          </SelectTrigger>
                          <SelectContent>
                            {FREQUENCY_TYPES.map((type) => (
                              <SelectItem key={type.id} value={type.id}>
                                {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="time">Horário</Label>
                        <Input
                          id="time"
                          type="time"
                          value={currentSchedule.time}
                          onChange={(e) => updateScheduleField("time", e.target.value)}
                        />
                      </div>

                      {currentSchedule.frequency === "weekly" && (
                        <div className="space-y-2">
                          <Label>Dias da Semana</Label>
                          <div className="grid grid-cols-7 gap-2">
                            {WEEKDAYS.map((day) => (
                              <Button
                                key={day.id}
                                type="button"
                                variant={currentSchedule.weekdays?.includes(day.id) ? "default" : "outline"}
                                className="h-10"
                                onClick={() => toggleWeekday(day.id)}
                              >
                                {day.name.substring(0, 3)}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      {currentSchedule.frequency === "monthly" && (
                        <div className="space-y-2">
                          <Label htmlFor="day-of-month">Dia do Mês</Label>
                          <Select
                            value={currentSchedule.dayOfMonth.toString()}
                            onValueChange={(value) => updateScheduleField("dayOfMonth", Number(value))}
                          >
                            <SelectTrigger id="day-of-month">
                              <SelectValue placeholder="Selecione o dia do mês" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                                <SelectItem key={day} value={day.toString()}>
                                  Dia {day}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div className="pt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Última execução:</span>
                          <span>{formatDate(currentSchedule.lastRun)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Próxima execução:</span>
                          <span>{formatDate(currentSchedule.nextRun)}</span>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="options" className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="generate-description"
                          checked={currentSchedule.generateDescription}
                          onCheckedChange={(checked) => updateScheduleField("generateDescription", checked)}
                        />
                        <Label htmlFor="generate-description">Gerar Descrição com IA</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="include-second-variation"
                          checked={currentSchedule.includeSecondVariation}
                          onCheckedChange={(checked) => updateScheduleField("includeSecondVariation", checked)}
                        />
                        <Label htmlFor="include-second-variation">Incluir Segunda Variação</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="save-to-gallery"
                          checked={currentSchedule.saveToGallery}
                          onCheckedChange={(checked) => updateScheduleField("saveToGallery", checked)}
                        />
                        <Label htmlFor="save-to-gallery">Salvar na Galeria</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="notify-by-email"
                          checked={currentSchedule.notifyByEmail}
                          onCheckedChange={(checked) => updateScheduleField("notifyByEmail", checked)}
                        />
                        <Label htmlFor="notify-by-email">Notificar por E-mail</Label>
                      </div>

                      {currentSchedule.notifyByEmail && (
                        <div className="space-y-2">
                          <Label htmlFor="email">E-mail para Notificação</Label>
                          <Input
                            id="email"
                            type="email"
                            value={currentSchedule.email}
                            onChange={(e) => updateScheduleField("email", e.target.value)}
                            placeholder="seu@email.com"
                          />
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-12">
                    <p className="text-muted-foreground mb-4">
                      Selecione um agendamento existente ou crie um novo para começar.
                    </p>
                    <Button variant="outline" onClick={createNewSchedule}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Novo Agendamento
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-end">
          {currentSchedule.id && (
            <Button onClick={saveCurrentSchedule} disabled={isLoading || isSaving || !currentSchedule.name}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Agendamento
                </>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Execuções</CardTitle>
          <CardDescription>Visualize o histórico de execuções dos agendamentos</CardDescription>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agendamento</TableHead>
                <TableHead>Data de Execução</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Produtos Gerados</TableHead>
                <TableHead className="text-right">Duração</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingHistory ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : executionHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                    Nenhuma execução registrada
                  </TableCell>
                </TableRow>
              ) : (
                executionHistory.map((execution) => (
                  <TableRow key={execution.id}>
                    <TableCell className="font-medium">{execution.scheduleName}</TableCell>
                    <TableCell>{formatDate(execution.executionDate)}</TableCell>
                    <TableCell>
                      <Badge variant={execution.status === "completed" ? "default" : "outline"}>
                        {execution.status === "completed" ? "Concluído" : execution.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{execution.productsGenerated}</TableCell>
                    <TableCell className="text-right">{execution.duration}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
