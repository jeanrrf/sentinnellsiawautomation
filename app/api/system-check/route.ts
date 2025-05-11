import { NextResponse } from "next/server"
import { createLogger, ErrorCodes } from "@/lib/logger"
import os from "os"

const logger = createLogger("API:SystemCheck")

export async function GET() {
  const startTime = Date.now()
  logger.info("Iniciando verificação de status do sistema")

  try {
    // Verificar Redis
    let redisStatus = { connected: false, info: "Não verificado" }
    try {
      const { isRedisAvailable } = await import("@/lib/redis")
      const isConnected = await isRedisAvailable()
      redisStatus = {
        connected: isConnected,
        info: isConnected ? "Conectado" : "Falha na conexão",
      }
    } catch (error) {
      logger.error("Erro ao verificar Redis:", error)
      redisStatus = {
        connected: false,
        info: `Erro: ${error.message}`,
      }
    }

    // Verificar armazenamento
    let storageStatus = { writable: false, info: "Não verificado" }
    try {
      const fs = await import("fs/promises")
      const path = await import("path")
      const tempDir = process.env.TEMP_DIR || path.join(os.tmpdir(), "shopee-tiktok-test")

      // Verificar se o diretório existe
      try {
        await fs.access(tempDir)
      } catch {
        // Criar diretório se não existir
        await fs.mkdir(tempDir, { recursive: true })
      }

      // Testar escrita
      const testFile = path.join(tempDir, `test-file-${Date.now()}.txt`)
      await fs.writeFile(testFile, "Test content")

      // Testar leitura
      const content = await fs.readFile(testFile, "utf-8")
      const readSuccess = content === "Test content"

      // Testar exclusão
      await fs.unlink(testFile)

      storageStatus = {
        writable: true,
        info: "Sistema de arquivos operacional",
      }
    } catch (error) {
      logger.error("Erro ao verificar armazenamento:", error)
      storageStatus = {
        writable: false,
        info: `Erro: ${error.message}`,
      }
    }

    // Informações do ambiente
    const environment = {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      cpus: `${os.cpus().length} cores`,
      memory: `${Math.round(os.totalmem() / (1024 * 1024 * 1024))} GB`,
    }

    // Informações de recursos
    const memoryUsage = process.memoryUsage()
    const resources = {
      memoryUsage: `${Math.round(memoryUsage.rss / (1024 * 1024))} MB`,
      memoryPercentage: Math.round((memoryUsage.rss / os.totalmem()) * 100),
      elapsedTime: `${Date.now() - startTime} ms`,
      timePercentage: 0, // Não aplicável
    }

    // Configuração
    const config = {
      tempDir: process.env.TEMP_DIR || os.tmpdir(),
      nodeEnv: process.env.NODE_ENV || "development",
      vercel: process.env.VERCEL === "1" ? "Sim" : "Não",
    }

    // Verificar se há avisos
    const warnings = []
    if (!redisStatus.connected) {
      warnings.push({
        component: "Redis",
        message: "Conexão com Redis falhou",
        code: ErrorCodes.CACHE.CONNECTION_FAILED,
      })
    }

    if (!storageStatus.writable) {
      warnings.push({
        component: "Storage",
        message: "Sistema de arquivos não está operacional",
        code: ErrorCodes.STORAGE.WRITE_FAILED,
      })
    }

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      redis: redisStatus,
      storage: storageStatus,
      environment,
      resources,
      config,
      warnings: warnings.length > 0 ? warnings : null,
    }

    logger.info("Verificação de status do sistema concluída", {
      context: {
        redis: redisStatus.connected,
        storage: storageStatus.writable,
        warnings: warnings.length,
      },
    })

    return NextResponse.json(result)
  } catch (error) {
    logger.error("Erro ao verificar status do sistema:", error)

    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        error: error.message,
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
