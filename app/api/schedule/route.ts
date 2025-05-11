import { NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"
import { v4 as uuidv4 } from "uuid"

const logger = createLogger("API:Schedule")

// Simulação de armazenamento em memória para agendamentos
let schedules = [
  {
    id: "1",
    name: "Geração diária de vídeos",
    frequency: "daily",
    time: "09:00",
    active: true,
  },
  {
    id: "2",
    name: "Geração semanal de vídeos",
    frequency: "weekly",
    days: ["Segunda", "Quarta", "Sexta"],
    time: "14:00",
    active: false,
  },
]

// Função para simular acesso ao Redis
async function getSchedulesFromStorage() {
  // Em uma implementação real, isso buscaria do Redis
  return schedules
}

// Função para simular salvamento no Redis
async function saveScheduleToStorage(schedule) {
  // Em uma implementação real, isso salvaria no Redis
  const newSchedule = {
    ...schedule,
    id: uuidv4(),
  }
  schedules.push(newSchedule)
  return newSchedule
}

// Função para simular exclusão no Redis
async function deleteScheduleFromStorage(id) {
  // Em uma implementação real, isso excluiria do Redis
  schedules = schedules.filter((schedule) => schedule.id !== id)
  return true
}

// Função para simular atualização no Redis
async function updateScheduleInStorage(id, data) {
  // Em uma implementação real, isso atualizaria no Redis
  schedules = schedules.map((schedule) => (schedule.id === id ? { ...schedule, ...data } : schedule))
  return schedules.find((schedule) => schedule.id === id)
}

export async function GET() {
  try {
    logger.info("Buscando agendamentos")
    const schedules = await getSchedulesFromStorage()

    return NextResponse.json({ schedules })
  } catch (error) {
    logger.error("Erro ao buscar agendamentos", { error })
    return NextResponse.json({ error: "Erro ao buscar agendamentos", details: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const data = await request.json()
    logger.info("Criando novo agendamento", { data })

    // Validar dados
    if (!data.name || !data.frequency || !data.time) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 })
    }

    // Validações específicas por frequência
    if (data.frequency === "weekly" && (!data.days || data.days.length === 0)) {
      return NextResponse.json({ error: "Dias da semana são obrigatórios para agendamentos semanais" }, { status: 400 })
    }

    if (data.frequency === "monthly" && !data.date) {
      return NextResponse.json({ error: "Dia do mês é obrigatório para agendamentos mensais" }, { status: 400 })
    }

    const schedule = await saveScheduleToStorage(data)

    return NextResponse.json({ schedule })
  } catch (error) {
    logger.error("Erro ao criar agendamento", { error })
    return NextResponse.json({ error: "Erro ao criar agendamento", details: error.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID não fornecido" }, { status: 400 })
    }

    logger.info("Excluindo agendamento", { id })
    await deleteScheduleFromStorage(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("Erro ao excluir agendamento", { error })
    return NextResponse.json({ error: "Erro ao excluir agendamento", details: error.message }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const data = await request.json()

    if (!data.id) {
      return NextResponse.json({ error: "ID não fornecido" }, { status: 400 })
    }

    logger.info("Atualizando agendamento", { id: data.id, data })
    const updatedSchedule = await updateScheduleInStorage(data.id, data)

    if (!updatedSchedule) {
      return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 })
    }

    return NextResponse.json({ schedule: updatedSchedule })
  } catch (error) {
    logger.error("Erro ao atualizar agendamento", { error })
    return NextResponse.json({ error: "Erro ao atualizar agendamento", details: error.message }, { status: 500 })
  }
}
