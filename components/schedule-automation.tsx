"use client"

import { Badge } from "@/components/ui/badge"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { TextGenerationSettings } from "@/components/text-generation-settings"
import { CalendarIcon, Clock, Trash2, Plus, RefreshCw, Settings, Sparkles } from "lucide-react"

export function ScheduleAutomation() {
  const [activeTab, setActiveTab] = useState("schedules")
  const [schedules, setSchedules] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [date, setDate] = useState<Date>()
  const [time, setTime] = useState("12:00")
  const [frequency, setFrequency] = useState("once")
  const [productCount, setProductCount] = useState(5)
  const [darkMode, setDarkMode] = useState(false)
  const [includeAllStyles, setIncludeAllStyles] = useState(true)
  const [textGenerationSettings, setTextGenerationSettings] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Carregar agendamentos existentes
  useEffect(() => {
    fetchSchedules()
  }, [])

  const fetchSchedules = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/schedule")
      if (!response.ok) {
        throw new Error(`Erro ao buscar agendamentos: ${response.status}`)
      }
      const data = await response.json()
      setSchedules(data.schedules || [])
    } catch (error: any) {
      console.error("Erro ao buscar agendamentos:", error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao buscar agendamentos",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleScheduleCreate = async () => {
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
          productCount,
          darkMode,
          includeAllStyles,
          textGenerationSettings,
        }),
      })

      if (!response.ok) {
        throw new Error(`Falha ao criar agendamento: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Agendamento criado",
          description: "O agendamento foi criado com sucesso",
        })

        // Atualizar lista de agendamentos
        fetchSchedules()

        // Reset form
        setDate(undefined)
        setTime("12:00")
        setFrequency("once")
        setProductCount(5)
      } else {
        throw new Error(data.message || "Falha ao criar agendamento")
      }
    } catch (error: any) {
      console.error("Erro ao criar agendamento:", error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao criar agendamento",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleScheduleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/schedule?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(`Falha ao excluir agendamento: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Agendamento excluído",
          description: "O agendamento foi excluído com sucesso",
        })

        // Atualizar lista de agendamentos
        fetchSchedules()
      } else {
        throw new Error(data.message || "Falha ao excluir agendamento")
      }
    } catch (error: any) {
      console.error("Erro ao excluir agendamento:", error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao excluir agendamento",
      })
    }
  }

  const handleTextSettingsChange = (settings: any) => {
    setTextGenerationSettings(settings)
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="schedules">Agendamentos</TabsTrigger>
          <TabsTrigger value="create">Criar Novo</TabsTrigger>
          <TabsTrigger value="text-settings">Configurações de Texto</TabsTrigger>
        </TabsList>

        <TabsContent value="schedules" className="space-y-4 pt-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum agendamento encontrado.</p>
              <Button variant="outline" className="mt-4" onClick={() => setActiveTab("create")}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Agendamento
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {schedules.map((schedule) => (
                <Card key={schedule.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {format(new Date(schedule.date), "dd/MM/yyyy")} às {schedule.time}
                        </CardTitle>
                        <CardDescription>
                          {schedule.frequency === "once"
                            ? "Uma vez"
                            : schedule.frequency === "daily"
                              ? "Diariamente"
                              : "Semanalmente"}
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        {schedule.status === "pending" ? (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            Pendente
                          </Badge>
                        ) : schedule.status === "completed" ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Concluído
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            Em Progresso
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleScheduleDelete(schedule.id)}
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-1">
                        <Sparkles className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Produtos:</span>
                        <span>{schedule.productCount || 5}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Settings className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Modo:</span>
                        <span>{schedule.darkMode ? "Escuro" : "Claro"}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="create" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Criar Novo Agendamento</CardTitle>
              <CardDescription>
                Configure quando e como os cards de produtos serão gerados automaticamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="schedule-date">Data</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="schedule-date"
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
                <Label htmlFor="schedule-time">Horário</Label>
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                  <Input id="schedule-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="schedule-frequency">Frequência</Label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger id="schedule-frequency">
                    <SelectValue placeholder="Selecione a frequência" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">Uma vez</SelectItem>
                    <SelectItem value="daily">Diariamente</SelectItem>
                    <SelectItem value="weekly">Semanalmente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-count">Quantidade de Produtos</Label>
                <Input
                  id="product-count"
                  type="number"
                  min={1}
                  max={20}
                  value={productCount}
                  onChange={(e) => setProductCount(Number.parseInt(e.target.value) || 5)}
                />
                <p className="text-xs text-muted-foreground">
                  Número de produtos diferentes para gerar em cada execução
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="schedule-dark-mode">Modo Escuro</Label>
                  <Switch id="schedule-dark-mode" checked={darkMode} onCheckedChange={setDarkMode} />
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="schedule-all-styles">Todos os Estilos</Label>
                  <Switch id="schedule-all-styles" checked={includeAllStyles} onCheckedChange={setIncludeAllStyles} />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleScheduleCreate} disabled={isSubmitting || !date} className="w-full">
                {isSubmitting ? (
                  <>
                    <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-5 w-5" />
                    Criar Agendamento
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="text-settings" className="space-y-4 pt-4">
          <TextGenerationSettings onSettingsChange={handleTextSettingsChange} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
