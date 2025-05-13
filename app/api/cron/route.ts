import { NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"
import { Redis } from "@upstash/redis"

const logger = createLogger("API:Cron")

// Esta rota será chamada pelo Vercel Cron Jobs
export async function GET() {
  try {
    logger.info("Cron job triggered")

    // Verificar se estamos no Vercel
    const isVercel = process.env.VERCEL === "1"

    if (!isVercel) {
      logger.info("Not running in Vercel, skipping cron job")
      return NextResponse.json({ success: true, message: "Not running in Vercel environment" })
    }

    // Verificar se o job já está em execução para evitar execuções simultâneas
    try {
      const redis = Redis.fromEnv()
      const lockKey = "scheduler_lock"
      const lockValue = await redis.get(lockKey)

      if (lockValue) {
        const lockTime = Number.parseInt(lockValue as string)
        const now = Date.now()

        // Se o lock foi criado há menos de 5 minutos, não executar
        if (now - lockTime < 5 * 60 * 1000) {
          logger.info("Scheduler already running, skipping")
          return NextResponse.json({ success: true, message: "Scheduler already running" })
        }

        // Se o lock é antigo, consideramos que a execução anterior falhou
        logger.warn("Found stale lock, overriding")
      }

      // Criar lock
      await redis.set(lockKey, Date.now().toString(), { ex: 300 }) // Expira em 5 minutos
    } catch (redisError) {
      logger.error("Error accessing Redis for lock:", redisError)
      // Continuar mesmo sem conseguir criar o lock
    }

    // Importar e executar o scheduler
    try {
      // Importar dinamicamente o scheduler
      const { default: main } = await import("../../scripts/scheduler")

      // Executar o scheduler
      await main()

      logger.info("Scheduler executed successfully")

      // Liberar o lock
      try {
        const redis = Redis.fromEnv()
        await redis.del("scheduler_lock")
      } catch (unlockError) {
        logger.error("Error releasing lock:", unlockError)
      }

      return NextResponse.json({ success: true, message: "Scheduler executed successfully" })
    } catch (schedulerError) {
      logger.error("Error executing scheduler:", schedulerError)

      // Liberar o lock em caso de erro
      try {
        const redis = Redis.fromEnv()
        await redis.del("scheduler_lock")
      } catch (unlockError) {
        logger.error("Error releasing lock after failure:", unlockError)
      }

      return NextResponse.json(
        {
          success: false,
          message: "Error executing scheduler",
          error: schedulerError.message || "Unknown error",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    logger.error("Error in cron job:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error in cron job",
        error: error.message || "Unknown error",
      },
      { status: 500 },
    )
  }
}
