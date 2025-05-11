import { NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"
import { getRedisClient, isRedisAvailable } from "@/lib/redis"

const logger = createLogger("API:RedisStatus")

export async function GET() {
  try {
    // Verificar se o Redis está configurado
    const redisClient = getRedisClient()
    const isConfigured = !!redisClient

    // Verificar se o Redis está conectado
    let isConnected = false
    if (isConfigured) {
      isConnected = await isRedisAvailable()
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      configured: isConfigured,
      connected: isConnected,
      status: isConnected ? "healthy" : isConfigured ? "error" : "not_configured",
    })
  } catch (error) {
    logger.error("Erro ao verificar status do Redis", { error })
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        configured: false,
        connected: false,
        status: "error",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
