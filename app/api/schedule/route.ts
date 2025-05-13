import { type NextRequest, NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"
import { v4 as uuidv4 } from "uuid"
import { getRedisClient } from "@/lib/redis"
import { REDIS_KEYS } from "@/lib/redis-constants"

const logger = createLogger("schedule-api")

// Obter agendamentos
export async function GET(request: NextRequest) {
  try {
    const redis = await getRedisClient()

    if (!redis) {
      return NextResponse.json({
        success: false,
        message: "Redis não está disponível",
        schedules: [],
      })
    }

    // Obter todos os agendamentos
    const schedulesJson = await redis.get(REDIS_KEYS.schedules)
    const schedules = schedulesJson ? JSON.parse(schedulesJson) : []

    return NextResponse.json({
      success: true,
      schedules,
    })
  } catch (error: any) {
    logger.error("Erro ao obter agendamentos:", error)

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Erro ao obter agendamentos",
      },
      { status: 500 },
    )
  }
}

// Criar agendamento
export async function POST(request: NextRequest) {
  try {
    const redis = await getRedisClient()

    if (!redis) {
      return NextResponse.json(
        {
          success: false,
          message: "Redis não está disponível",
        },
        { status: 503 },
      )
    }

    // Obter dados do corpo da requisição
    const {
      date,
      time,
      frequency,
      productCount = 5,
      darkMode = false,
      includeAllStyles = true,
      textGenerationSettings = {},
    } = await request.json()

    // Validar dados
    if (!date || !time || !frequency) {
      return NextResponse.json(
        {
          success: false,
          message: "Dados incompletos. Data, hora e frequência são obrigatórios.",
        },
        { status: 400 },
      )
    }

    // Criar novo agendamento
    const newSchedule = {
      id: uuidv4(),
      date,
      time,
      frequency,
      productCount,
      darkMode,
      includeAllStyles,
      textGenerationSettings,
      status: "pending",
      createdAt: new Date().toISOString(),
    }

    // Obter agendamentos existentes
    const schedulesJson = await redis.get(REDIS_KEYS.schedules)
    const schedules = schedulesJson ? JSON.parse(schedulesJson) : []

    // Adicionar novo agendamento
    schedules.push(newSchedule)

    // Salvar agendamentos atualizados
    await redis.set(REDIS_KEYS.schedules, JSON.stringify(schedules))

    return NextResponse.json({
      success: true,
      message: "Agendamento criado com sucesso",
      schedule: newSchedule,
    })
  } catch (error: any) {
    logger.error("Erro ao criar agendamento:", error)

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Erro ao criar agendamento",
      },
      { status: 500 },
    )
  }
}

// Excluir agendamento
export async function DELETE(request: NextRequest) {
  try {
    const redis = await getRedisClient()

    if (!redis) {
      return NextResponse.json(
        {
          success: false,
          message: "Redis não está disponível",
        },
        { status: 503 },
      )
    }

    // Obter ID do agendamento a ser excluído
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "ID do agendamento não fornecido",
        },
        { status: 400 },
      )
    }

    // Obter agendamentos existentes
    const schedulesJson = await redis.get(REDIS_KEYS.schedules)
    const schedules = schedulesJson ? JSON.parse(schedulesJson) : []

    // Filtrar agendamentos para remover o agendamento com o ID fornecido
    const updatedSchedules = schedules.filter((schedule: any) => schedule.id !== id)

    // Verificar se algum agendamento foi removido
    if (updatedSchedules.length === schedules.length) {
      return NextResponse.json(
        {
          success: false,
          message: "Agendamento não encontrado",
        },
        { status: 404 },
      )
    }

    // Salvar agendamentos atualizados
    await redis.set(REDIS_KEYS.schedules, JSON.stringify(updatedSchedules))

    return NextResponse.json({
      success: true,
      message: "Agendamento excluído com sucesso",
    })
  } catch (error: any) {
    logger.error("Erro ao excluir agendamento:", error)

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Erro ao excluir agendamento",
      },
      { status: 500 },
    )
  }
}
