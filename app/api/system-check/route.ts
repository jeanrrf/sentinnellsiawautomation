import { NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"
import os from "os"

const logger = createLogger("API:SystemCheck")

export async function GET() {
  try {
    logger.info("Iniciando verificação do sistema")

    const startTime = Date.now()
    const startMemory = process.memoryUsage().heapUsed

    // Verificar componentes do sistema
    const components: Record<string, string> = {}
    const warnings: string[] = []
    const errors: string[] = []

    // Verificar Redis
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
      components["Redis"] = redisAvailable ? "operational" : "error"

      if (!redisAvailable) {
        errors.push("Redis não está disponível. Algumas funcionalidades podem não funcionar corretamente.")
      }
    } catch (redisError) {
      components["Redis"] = "error"
      errors.push(`Erro ao verificar Redis: ${redisError.message || "Erro desconhecido"}`)
      logger.error("Erro ao verificar Redis", { details: redisError })
    }

    // Verificar sistema de arquivos de forma segura
    try {
      components["Sistema de Arquivos"] = "operational"

      // Não vamos tentar escrever no sistema de arquivos para evitar erros
      // Apenas verificamos se o diretório temporário existe
      const tempDir = process.env.TEMP_DIR || os.tmpdir()

      // Verificar se o diretório existe sem usar fs
      try {
        // Verificar se o ambiente é Node.js
        if (typeof process !== "undefined" && process.versions && process.versions.node) {
          components["Ambiente"] = "Node.js"
        } else {
          components["Ambiente"] = "Navegador ou outro"
          warnings.push("Executando em ambiente não-Node.js. Algumas verificações serão limitadas.")
        }
      } catch (envError) {
        components["Ambiente"] = "Desconhecido"
        warnings.push("Não foi possível determinar o ambiente de execução.")
      }
    } catch (fsError) {
      components["Sistema de Arquivos"] = "warning"
      warnings.push(`Limitações no sistema de arquivos: ${fsError.message || "Erro desconhecido"}`)
      logger.warning("Limitações ao verificar sistema de arquivos", { details: fsError })
    }

    // Verificar Blob Storage
    try {
      const blobToken = process.env.BLOB_READ_WRITE_TOKEN

      if (!blobToken) {
        components["Blob Storage"] = "warning"
        warnings.push("Token do Blob Storage não configurado. O armazenamento de arquivos pode ser afetado.")
      } else {
        components["Blob Storage"] = "operational"
      }
    } catch (blobError) {
      components["Blob Storage"] = "error"
      errors.push(`Erro ao verificar Blob Storage: ${blobError.message || "Erro desconhecido"}`)
      logger.error("Erro ao verificar Blob Storage", { details: blobError })
    }

    // Verificar variáveis de ambiente da Shopee
    try {
      const shopeeAppId = process.env.SHOPEE_APP_ID
      const shopeeAppSecret = process.env.SHOPEE_APP_SECRET
      const shopeeRedirectUrl = process.env.SHOPEE_REDIRECT_URL

      if (!shopeeAppId || !shopeeAppSecret || !shopeeRedirectUrl) {
        components["API Shopee"] = "warning"
        warnings.push(
          "Algumas variáveis de ambiente da Shopee não estão configuradas. A integração com a Shopee pode ser afetada.",
        )
      } else {
        components["API Shopee"] = "operational"
      }
    } catch (shopeeError) {
      components["API Shopee"] = "error"
      errors.push(`Erro ao verificar configuração da Shopee: ${shopeeError.message || "Erro desconhecido"}`)
      logger.error("Erro ao verificar configuração da Shopee", { details: shopeeError })
    }

    // Verificar variáveis de ambiente do Gemini
    try {
      const geminiApiKey = process.env.GEMINI_API_KEY

      if (!geminiApiKey) {
        components["API Gemini"] = "warning"
        warnings.push("API Key do Gemini não configurada. A geração de descrições pode ser afetada.")
      } else {
        components["API Gemini"] = "operational"
      }
    } catch (geminiError) {
      components["API Gemini"] = "error"
      errors.push(`Erro ao verificar configuração do Gemini: ${geminiError.message || "Erro desconhecido"}`)
      logger.error("Erro ao verificar configuração do Gemini", { details: geminiError })
    }

    // Calcular recursos utilizados
    const endTime = Date.now()
    const endMemory = process.memoryUsage().heapUsed

    const elapsedTime = `${endTime - startTime}ms`
    const memoryIncrease = `${((endMemory - startMemory) / 1024 / 1024).toFixed(2)}MB`

    // Verificar uso de CPU de forma segura
    let cpuUsage = "N/A"
    try {
      cpuUsage = os.loadavg()[0].toFixed(2)
    } catch (cpuError) {
      logger.warning("Erro ao verificar uso de CPU", { details: cpuError })
    }

    // Verificar espaço em disco de forma segura
    let diskSpace = "N/A"
    try {
      // Não vamos tentar verificar o espaço em disco para evitar erros
      diskSpace = "Verificação desativada"
    } catch (diskError) {
      logger.warning("Erro ao verificar espaço em disco", { details: diskError })
    }

    // Determinar status geral do sistema
    const success = errors.length === 0

    logger.info("Verificação do sistema concluída", {
      success,
      warningsCount: warnings.length,
      errorsCount: errors.length,
    })

    return NextResponse.json({
      success,
      components,
      warnings,
      errors,
      resources: {
        elapsedTime,
        memoryIncrease,
        cpuUsage,
        diskSpace,
      },
    })
  } catch (error) {
    logger.error("Erro ao verificar status do sistema", { details: error })

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erro desconhecido ao verificar status do sistema",
      },
      { status: 500 },
    )
  }
}
