import { NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"

const logger = createLogger("API:SystemStatus")

export async function GET() {
  try {
    logger.info("Verificando status do sistema (versão simplificada)")

    // Verificar componentes essenciais
    const warnings: string[] = []
    const errors: string[] = []

    // Verificar Redis de forma simplificada
    try {
      // Importar de forma segura para evitar erros de importação
      let isRedisAvailable
      try {
        const redis = await import("@/lib/redis")
        isRedisAvailable = redis.isRedisAvailable || (async () => false)
      } catch (importError) {
        logger.warning("Não foi possível importar o módulo Redis:", { details: importError })
        isRedisAvailable = async () => false
      }

      const redisAvailable = await isRedisAvailable().catch(() => false)

      if (!redisAvailable) {
        warnings.push("Redis não está disponível")
      }
    } catch (redisError) {
      warnings.push("Erro ao verificar Redis")
      logger.error("Erro ao verificar Redis (simplificado)", { details: redisError })
    }

    // Verificar variáveis de ambiente essenciais
    const essentialEnvVars = [
      "BLOB_READ_WRITE_TOKEN",
      "SHOPEE_APP_ID",
      "SHOPEE_APP_SECRET",
      "SHOPEE_REDIRECT_URL",
      "GEMINI_API_KEY",
    ]

    const missingEnvVars = essentialEnvVars.filter((envVar) => !process.env[envVar])
    if (missingEnvVars.length > 0) {
      warnings.push(`Variáveis de ambiente ausentes: ${missingEnvVars.join(", ")}`)
    }

    // Determinar status geral do sistema
    const success = errors.length === 0

    logger.info("Verificação simplificada do sistema concluída", {
      success,
      warningsCount: warnings.length,
      errorsCount: errors.length,
    })

    return NextResponse.json({
      success,
      warnings,
      errors,
    })
  } catch (error) {
    logger.error("Erro ao verificar status do sistema (simplificado)", { details: error })

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erro desconhecido ao verificar status do sistema",
      },
      { status: 500 },
    )
  }
}
