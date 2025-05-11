"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Plus, Trash2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "@/components/ui/use-toast"

// Tipo para um agendamento
interface Schedule {
  id: string
  name: string
  frequency: "daily" | "weekly" | "monthly"
  time: string
  days?: string[]
  date?: number
  active: boolean
}

// Componente para exibir um agendamento
function ScheduleItem({
  schedule,
  onDelete,
  onToggle,
}: {
  schedule: Schedule
  onDelete: (id: string) => void
  onToggle: (id: string, active: boolean) => void
}) {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{schedule.name}</CardTitle>
          <div className="flex items-center gap-2">
            <Checkbox
              id={`active-${schedule.id}`}
              checked={schedule.active}
              onCheckedChange={(checked) => onToggle(schedule.id, checked === true)}
            />
            <Label htmlFor={`active-${schedule.id}`} className="text-sm">
              Ativo
            </Label>
          </div>
        </div>
        <CardDescription>
          {schedule.frequency === "daily" && "Executa diariamente"}
          {schedule.frequency === "weekly" &&
            `Executa semanalmente ${schedule.days ? `nos dias: ${schedule.days.join(", ")}` : ""}`}
          {schedule.frequency === "monthly" && `Executa mensalmente ${schedule.date ? `no dia ${schedule.date}` : ""}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="text-sm">
          Horário: <span className="font-medium">{schedule.time}</span>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Button variant="destructive" size="sm" onClick={() => onDelete(schedule.id)}>
          <Trash2 className="h-4 w-4 mr-1" />
          Excluir
        </Button>
      </CardFooter>
    </Card>
  )
}

// Componente principal de automação
export function ScheduleAutomation() {
  // Estados
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  // Estados do formulário
  const [name, setName] = useState("")
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">("daily")
  const [time, setTime] = useState("12:00")
  const [days, setDays] = useState<string[]>([])
  const [date, setDate] = useState<number>(1)
  const [submitting, setSubmitting] = useState(false)

  // Carregar agendamentos
  useEffect(() => {
    async function loadSchedules() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch("/api/schedule", {
          cache: "no-store",
          next: { revalidate: 0 },
        })

        if (!response.ok) {
          throw new Error(`Erro ao carregar agendamentos: ${response.status}`)
        }

        const data = await response.json()

        // Verificar se data.schedules existe e é um array
        if (data && Array.isArray(data.schedules)) {
          setSchedules(data.schedules)
        } else {
          // Se não for um array, inicializar com array vazio
          setSchedules([])
          console.warn("Dados de agendamentos inválidos:", data)
        }
      } catch (err) {
        console.error("Erro ao carregar agendamentos:", err)
        setError("Não foi possível carregar os agendamentos. Tente novamente mais tarde.")
        // Inicializar com array vazio em caso de erro
        setSchedules([])
      } finally {
        setLoading(false)
      }
    }

    loadSchedules()
  }, [])

  // Adicionar agendamento
  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setSubmitting(true)

      const newSchedule: Omit<Schedule, "id"> = {
        name,
        frequency,
        time,
        active: true,
      }

      if (frequency === "weekly") {
        newSchedule.days = days
      } else if (frequency === "monthly") {
        newSchedule.date = date
      }

      const response = await fetch("/api/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newSchedule),
      })

      if (!response.ok) {
        throw new Error(`Erro ao adicionar agendamento: ${response.status}`)
      }

      const data = await response.json()

      // Verificar se data.schedule existe
      if (data && data.schedule) {
        setSchedules((prev) => [...prev, data.schedule])
        setShowForm(false)
        resetForm()
        toast({
          title: "Agendamento criado",
          description: "O agendamento foi criado com sucesso.",
        })
      } else {
        throw new Error("Resposta inválida do servidor")
      }
    } catch (err) {
      console.error("Erro ao adicionar agendamento:", err)
      toast({
        title: "Erro",
        description: "Não foi possível criar o agendamento. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Excluir agendamento
  const handleDeleteSchedule = async (id: string) => {
    try {
      const response = await fetch(`/api/schedule?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(`Erro ao excluir agendamento: ${response.status}`)
      }

      setSchedules((prev) => prev.filter((schedule) => schedule.id !== id))
      toast({
        title: "Agendamento excluído",
        description: "O agendamento foi excluído com sucesso.",
      })
    } catch (err) {
      console.error("Erro ao excluir agendamento:", err)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o agendamento. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  // Alternar status do agendamento
  const handleToggleSchedule = async (id: string, active: boolean) => {
    try {
      const response = await fetch(`/api/schedule`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, active }),
      })

      if (!response.ok) {
        throw new Error(`Erro ao atualizar agendamento: ${response.status}`)
      }

      setSchedules((prev) => prev.map((schedule) => (schedule.id === id ? { ...schedule, active } : schedule)))
      toast({
        title: active ? "Agendamento ativado" : "Agendamento desativado",
        description: `O agendamento foi ${active ? "ativado" : "desativado"} com sucesso.`,
      })
    } catch (err) {
      console.error("Erro ao atualizar agendamento:", err)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o agendamento. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  // Resetar formulário
  const resetForm = () => {
    setName("")
    setFrequency("daily")
    setTime("12:00")
    setDays([])
    setDate(1)
  }

  // Manipular seleção de dias da semana
  const handleDayToggle = (day: string) => {
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]))
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Agendamentos</h2>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? (
            "Cancelar"
          ) : (
            <>
              <Plus className="h-4 w-4 mr-1" />
              Novo Agendamento
            </>
          )}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Novo Agendamento</CardTitle>
            <CardDescription>Configure quando os vídeos serão gerados automaticamente</CardDescription>
          </CardHeader>
          <form onSubmit={handleAddSchedule}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do agendamento</Label>
                <Input
                  id="name"
                  placeholder="Ex: Geração diária de vídeos"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency">Frequência</Label>
                <Select
                  value={frequency}
                  onValueChange={(value) => setFrequency(value as "daily" | "weekly" | "monthly")}
                >
                  <SelectTrigger id="frequency">
                    <SelectValue placeholder="Selecione a frequência" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Diariamente</SelectItem>
                    <SelectItem value="weekly">Semanalmente</SelectItem>
                    <SelectItem value="monthly">Mensalmente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {frequency === "weekly" && (
                <div className="space-y-2">
                  <Label>Dias da semana</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"].map((day) => (
                      <div key={day} className="flex items-center space-x-2">
                        <Checkbox
                          id={`day-${day}`}
                          checked={days.includes(day)}
                          onCheckedChange={() => handleDayToggle(day)}
                        />
                        <Label htmlFor={`day-${day}`}>{day}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {frequency === "monthly" && (
                <div className="space-y-2">
                  <Label htmlFor="date">Dia do mês</Label>
                  <Select value={String(date)} onValueChange={(value) => setDate(Number(value))}>
                    <SelectTrigger id="date">
                      <SelectValue placeholder="Selecione o dia" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                        <SelectItem key={day} value={String(day)}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="time">Horário</Label>
                <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Salvar Agendamento
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : schedules.length === 0 ? (
        <Card className="bg-muted/50">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <p className="text-muted-foreground mb-4">Nenhum agendamento configurado</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Criar Agendamento
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {schedules.map((schedule) => (
            <ScheduleItem
              key={schedule.id}
              schedule={schedule}
              onDelete={handleDeleteSchedule}
              onToggle={handleToggleSchedule}
            />
          ))}
        </div>
      )}
    </div>
  )
}
