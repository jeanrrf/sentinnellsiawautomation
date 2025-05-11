import { type NextRequest, NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"
import { getRedisClient } from "@/lib/redis"

const logger = createLogger("API:AutoDownloadFull")

export async function GET(req: NextRequest) {
  try {
    logger.info("Auto download full request received")

    // Verificar se estamos no Vercel
    const isVercel = process.env.VERCEL === "1"
    let schedules = []

    // Obter os agendamentos
    if (isVercel) {
      try {
        const redis = getRedisClient()
        if (!redis) {
          return NextResponse.json(
            {
              success: false,
              message: "Redis client not available",
            },
            { status: 500 },
          )
        }

        const schedulesData = await redis.get("schedules")

        if (typeof schedulesData === "string") {
          schedules = JSON.parse(schedulesData)
        } else if (Array.isArray(schedulesData)) {
          schedules = schedulesData
        } else if (schedulesData) {
          schedules = [schedulesData]
        }

        logger.info(`Found ${schedules.length} schedules in Redis`)
      } catch (redisError) {
        return NextResponse.json(
          {
            success: false,
            message: "Error accessing Redis",
            error: redisError.message,
          },
          { status: 500 },
        )
      }
    } else {
      try {
        const fs = await import("fs")
        const path = await import("path")

        const schedulesPath = path.default.join(process.cwd(), "database", "schedules.json")

        if (!fs.default.existsSync(schedulesPath)) {
          return NextResponse.json(
            {
              success: false,
              message: "No schedules found",
            },
            { status: 404 },
          )
        }

        const rawData = fs.default.readFileSync(schedulesPath, "utf-8")
        const data = JSON.parse(rawData)
        schedules = data.schedules || []

        logger.info(`Found ${schedules.length} schedules in file system`)
      } catch (fsError) {
        return NextResponse.json(
          {
            success: false,
            message: "Error accessing file system",
            error: fsError.message,
          },
          { status: 500 },
        )
      }
    }

    // Retornar os agendamentos encontrados
    return NextResponse.json({
      success: true,
      message: "Schedules retrieved successfully",
      count: schedules.length,
      schedules: schedules.map((s: any) => ({
        id: s.id,
        name: s.name,
        status: s.status,
        cardsCount: s.generatedCards?.length || 0,
      })),
    })
  } catch (error) {
    logger.error("Error processing auto download full request:", {
      message: error.message,
      stack: error.stack,
    })

    return NextResponse.json(
      {
        success: false,
        message: "Error processing request",
        error: error.message || "Unknown error",
      },
      { status: 500 },
    )
  }
}
