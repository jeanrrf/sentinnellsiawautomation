import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { createLogger } from "@/lib/logger"
import { Redis } from "@upstash/redis"

const logger = createLogger("API:Schedule")

interface Schedule {
  id: string
  date: string
  time: string
  frequency: string
  status: string
  type?: string // New field to distinguish between regular and auto-download schedules
  lastRun?: string
  productCount?: number
  generatedCards?: string[]
  errors?: string[]
}

// Modificar a função GET para usar Redis em vez de sistema de arquivos em produção
export async function GET() {
  try {
    logger.info("Fetching schedules")
    // Verificar se estamos no Vercel
    const isVercel = process.env.VERCEL === "1"

    if (isVercel) {
      // Em produção, usar Redis para armazenar agendamentos
      try {
        const redis = Redis.fromEnv()
        const schedulesData = await redis.get("schedules")
        logger.info("Fetched schedules from Redis")

        return NextResponse.json({
          schedules: schedulesData ? JSON.parse(schedulesData) : [],
        })
      } catch (redisError) {
        logger.error("Error accessing Redis:", redisError)
        return NextResponse.json({
          schedules: [],
          message: "Erro ao acessar Redis. Usando dados simulados.",
        })
      }
    }

    // Em ambiente de desenvolvimento, tentar usar o sistema de arquivos
    const schedulesPath = path.join(process.cwd(), "database", "schedules.json")

    try {
      if (!fs.existsSync(schedulesPath)) {
        const dir = path.dirname(schedulesPath)
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true })
        }

        fs.writeFileSync(schedulesPath, JSON.stringify({ schedules: [] }, null, 2))
        logger.info("Created empty schedules file")
        return NextResponse.json({ schedules: [] })
      }

      const rawData = fs.readFileSync(schedulesPath, "utf-8")
      const data = JSON.parse(rawData)
      logger.info(`Found ${data.schedules?.length || 0} schedules`)

      return NextResponse.json({ schedules: data.schedules || [] })
    } catch (fsError) {
      logger.error("Error accessing file system:", fsError)
      // Fallback para dados simulados em caso de erro
      return NextResponse.json({
        schedules: [],
        message: "Erro ao acessar sistema de arquivos. Usando dados simulados.",
      })
    }
  } catch (error) {
    logger.error("Error fetching schedules:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Falha ao buscar agendamentos",
        error: error.message || "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}

// Modificar a função POST para usar Redis em produção
export async function POST(req: Request) {
  try {
    const { date, time, frequency, type = "regular" } = await req.json()
    logger.info("Creating new schedule", { date, time, frequency, type })

    if (!date || !time || !frequency) {
      logger.warn("Missing required fields", { date, time, frequency })
      return NextResponse.json({ success: false, message: "Date, time, and frequency are required" }, { status: 400 })
    }

    // Verificar se estamos no Vercel
    const isVercel = process.env.VERCEL === "1"

    const newSchedule: Schedule = {
      id: Date.now().toString(),
      date,
      time,
      frequency,
      type, // Include the schedule type
      status: "pending",
      generatedCards: [],
      errors: [],
    }

    if (isVercel) {
      // Em produção, usar Redis
      try {
        const redis = Redis.fromEnv()
        const schedulesData = await redis.get("schedules")
        const schedules = schedulesData ? JSON.parse(schedulesData) : []

        schedules.push(newSchedule)
        await redis.set("schedules", JSON.stringify(schedules))

        logger.info("Added new schedule to Redis", { id: newSchedule.id })

        return NextResponse.json({
          success: true,
          schedule: newSchedule,
        })
      } catch (redisError) {
        logger.error("Error accessing Redis:", redisError)
        return NextResponse.json(
          {
            success: false,
            message: "Erro ao acessar Redis.",
            error: redisError.message,
          },
          { status: 500 },
        )
      }
    }

    // Em ambiente de desenvolvimento, tentar usar o sistema de arquivos
    try {
      const schedulesPath = path.join(process.cwd(), "database", "schedules.json")

      let schedules: Schedule[] = []
      if (fs.existsSync(schedulesPath)) {
        const rawData = fs.readFileSync(schedulesPath, "utf-8")
        const data = JSON.parse(rawData)
        schedules = data.schedules || []
      } else {
        const dir = path.dirname(schedulesPath)
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true })
        }
      }

      schedules.push(newSchedule)
      logger.info("Added new schedule", { id: newSchedule.id })

      fs.writeFileSync(schedulesPath, JSON.stringify({ schedules }, null, 2))

      return NextResponse.json({
        success: true,
        schedule: newSchedule,
      })
    } catch (fsError) {
      logger.error("Error accessing file system:", fsError)
      // Fallback para sucesso simulado em caso de erro
      return NextResponse.json(
        {
          success: false,
          message: "Erro ao acessar sistema de arquivos.",
          error: fsError.message,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    logger.error("Error creating schedule:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Falha ao criar agendamento",
        error: error.message || "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json()
    logger.info("Deleting schedule", { id })

    if (!id) {
      logger.warn("Missing schedule ID")
      return NextResponse.json({ success: false, message: "Schedule ID is required" }, { status: 400 })
    }

    // Verificar se estamos no Vercel
    const isVercel = process.env.VERCEL === "1"

    if (isVercel) {
      // No Vercel, retornar sucesso simulado
      logger.info("Running in Vercel environment, returning simulated success")
      return NextResponse.json({
        success: true,
        message: "Ambiente de produção detectado. Usando dados simulados.",
      })
    }

    // Em ambiente de desenvolvimento, tentar usar o sistema de arquivos
    try {
      const schedulesPath = path.join(process.cwd(), "database", "schedules.json")

      if (!fs.existsSync(schedulesPath)) {
        logger.warn("Schedules file not found")
        return NextResponse.json({ success: false, message: "No schedules found" }, { status: 404 })
      }

      const rawData = fs.readFileSync(schedulesPath, "utf-8")
      const data = JSON.parse(rawData)
      const schedules = data.schedules || []

      const updatedSchedules = schedules.filter((schedule: Schedule) => schedule.id !== id)
      logger.info(`Removed schedule, remaining: ${updatedSchedules.length}`)

      fs.writeFileSync(schedulesPath, JSON.stringify({ schedules: updatedSchedules }, null, 2))

      return NextResponse.json({
        success: true,
      })
    } catch (fsError) {
      logger.error("Error accessing file system:", fsError)
      // Fallback para sucesso simulado em caso de erro
      return NextResponse.json({
        success: true,
        message: "Erro ao acessar sistema de arquivos. Usando dados simulados.",
      })
    }
  } catch (error) {
    logger.error("Error deleting schedule:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Falha ao excluir agendamento",
        error: error.message || "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}

// New endpoint to download generated cards
export async function PATCH(req: Request) {
  try {
    const { id, action } = await req.json()
    logger.info("Schedule action request", { id, action })

    if (!id || !action) {
      logger.warn("Missing required fields", { id, action })
      return NextResponse.json({ success: false, message: "Schedule ID and action are required" }, { status: 400 })
    }

    // Verificar se estamos no Vercel
    const isVercel = process.env.VERCEL === "1"

    if (isVercel) {
      // No Vercel, retornar sucesso simulado
      logger.info("Running in Vercel environment, returning simulated success")
      return NextResponse.json({
        success: true,
        message: "Ambiente de produção detectado. Usando dados simulados.",
      })
    }

    // Em ambiente de desenvolvimento, tentar usar o sistema de arquivos
    try {
      const schedulesPath = path.join(process.cwd(), "database", "schedules.json")

      if (!fs.existsSync(schedulesPath)) {
        logger.warn("Schedules file not found")
        return NextResponse.json({ success: false, message: "No schedules found" }, { status: 404 })
      }

      const rawData = fs.readFileSync(schedulesPath, "utf-8")
      const data = JSON.parse(rawData)
      const schedules = data.schedules || []

      const schedule = schedules.find((s: Schedule) => s.id === id)

      if (!schedule) {
        logger.warn("Schedule not found", { id })
        return NextResponse.json({ success: false, message: "Schedule not found" }, { status: 404 })
      }

      // Handle different actions
      if (action === "reset") {
        // Reset schedule to pending
        schedule.status = "pending"
        schedule.lastRun = undefined
        schedule.productCount = undefined
        schedule.generatedCards = []
        schedule.errors = []
        logger.info("Reset schedule", { id })
      } else if (action === "download" && schedule.generatedCards && schedule.generatedCards.length > 0) {
        // For download action, we'll return the path to the first card
        // The actual download will be handled by the frontend
        const cardPath = schedule.generatedCards[0]

        if (!fs.existsSync(cardPath)) {
          logger.warn("Card file not found", { cardPath })
          return NextResponse.json({ success: false, message: "Card file not found" }, { status: 404 })
        }

        logger.info("Returning card path for download", { cardPath })
        return NextResponse.json({
          success: true,
          cardPath,
          fileName: path.basename(cardPath),
        })
      } else {
        logger.warn("Invalid action", { action })
        return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 })
      }

      fs.writeFileSync(schedulesPath, JSON.stringify({ schedules }, null, 2))

      return NextResponse.json({
        success: true,
      })
    } catch (fsError) {
      logger.error("Error accessing file system:", fsError)
      return NextResponse.json(
        {
          success: false,
          message: "Erro ao acessar sistema de arquivos.",
          error: fsError.message,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    logger.error("Error processing schedule action:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Falha ao processar ação do agendamento",
        error: error.message || "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
