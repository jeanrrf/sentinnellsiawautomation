import { type NextRequest, NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"
import { v4 as uuidv4 } from "uuid"
import { kv } from "@vercel/kv"
import { REDIS_KEYS } from "@/lib/redis-constants"

const logger = createLogger("API:SuperSchedule")

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { date, time, frequency, darkMode, includeAllStyles } = body

    // Validar dados
    if (!date || !time || !frequency) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields",
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
      status: "pending",
      type: "super-card",
      createdAt: new Date().toISOString(),
      options: {
        darkMode: !!darkMode,
        includeAllStyles: includeAllStyles !== false,
      },
    }

    // Obter agendamentos existentes
    let schedules = []
    try {
      const existingSchedules = await kv.get(REDIS_KEYS.SCHEDULES)
      if (existingSchedules && Array.isArray(existingSchedules)) {
        schedules = existingSchedules
      }
    } catch (error) {
      logger.warn("Failed to get existing schedules, using empty array", { error })
    }

    // Adicionar novo agendamento
    schedules.push(newSchedule)

    // Salvar agendamentos
    try {
      await kv.set(REDIS_KEYS.SCHEDULES, schedules)
    } catch (error) {
      logger.error("Failed to save schedules", { error })
      return NextResponse.json(
        {
          success: false,
          message: "Failed to save schedule",
          error: error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Schedule created successfully",
      schedule: newSchedule,
    })
  } catch (error) {
    logger.error("Error creating schedule:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create schedule",
        error: error.message,
      },
      { status: 500 },
    )
  }
}
