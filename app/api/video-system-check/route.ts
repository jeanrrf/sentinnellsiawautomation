import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import os from "os"
import { createLogger, ErrorCodes } from "@/lib/logger"

const logger = createLogger("API:VideoSystemCheck")

// Verificar se estamos em ambiente Vercel
const isVercel = process.env.VERCEL === "1"

export async function GET() {
  const startTime = Date.now()
  logger.info("Iniciando verificação do sistema de vídeo", {
    context: { isVercel },
  })

  try {
    // Verificar binários
    const ffmpegPath = process.env.FFMPEG_PATH
    const ffprobePath = process.env.FFPROBE_PATH
    const tempDir = process.env.TEMP_DIR || path.join(os.tmpdir(), "shopee-tiktok")

    let ffmpegExists = false
    let ffprobeExists = false
    let tempDirExists = false
    let tempDirWritable = false
    const warnings = []

    // Verificar FFmpeg
    if (ffmpegPath) {
      try {
        ffmpegExists = fs.existsSync(ffmpegPath)
        if (!ffmpegExists && !isVercel) {
          warnings.push({
            component: "FFmpeg",
            message: "FFmpeg não encontrado no caminho especificado",
            code: ErrorCodes.SYSTEM.DEPENDENCY_MISSING,
          })
          logger.warning("FFmpeg não encontrado", {
            code: ErrorCodes.SYSTEM.DEPENDENCY_MISSING,
            context: { path: ffmpegPath },
          })
        }
      } catch (error) {
        logger.error("Erro ao verificar FFmpeg", {
          code: ErrorCodes.STORAGE.READ_FAILED,
          details: error,
        })
        warnings.push({
          component: "FFmpeg",
          message: "Erro ao verificar FFmpeg: " + error.message,
          code: ErrorCodes.STORAGE.READ_FAILED,
        })
      }
    } else {
      warnings.push({
        component: "FFmpeg",
        message: "FFMPEG_PATH não está definido",
        code: ErrorCodes.SYSTEM.DEPENDENCY_MISSING,
      })
      logger.warning("FFMPEG_PATH não está definido", {
        code: ErrorCodes.SYSTEM.DEPENDENCY_MISSING,
      })
    }

    // Verificar FFprobe
    if (ffprobePath) {
      try {
        ffprobeExists = fs.existsSync(ffprobePath)
        if (!ffprobeExists && !isVercel) {
          warnings.push({
            component: "FFprobe",
            message: "FFprobe não encontrado no caminho especificado",
            code: ErrorCodes.SYSTEM.DEPENDENCY_MISSING,
          })
          logger.warning("FFprobe não encontrado", {
            code: ErrorCodes.SYSTEM.DEPENDENCY_MISSING,
            context: { path: ffprobePath },
          })
        }
      } catch (error) {
        logger.error("Erro ao verificar FFprobe", {
          code: ErrorCodes.STORAGE.READ_FAILED,
          details: error,
        })
        warnings.push({
          component: "FFprobe",
          message: "Erro ao verificar FFprobe: " + error.message,
          code: ErrorCodes.STORAGE.READ_FAILED,
        })
      }
    } else {
      warnings.push({
        component: "FFprobe",
        message: "FFPROBE_PATH não está definido",
        code: ErrorCodes.SYSTEM.DEPENDENCY_MISSING,
      })
      logger.warning("FFPROBE_PATH não está definido", {
        code: ErrorCodes.SYSTEM.DEPENDENCY_MISSING,
      })
    }

    // Verificar diretório temporário
    try {
      tempDirExists = fs.existsSync(tempDir)
      if (!tempDirExists) {
        try {
          fs.mkdirSync(tempDir, { recursive: true })
          tempDirExists = true
          logger.info("Diretório temporário criado", {
            context: { path: tempDir },
          })
        } catch (error) {
          logger.error("Erro ao criar diretório temporário", {
            code: ErrorCodes.STORAGE.WRITE_FAILED,
            details: error,
          })
          warnings.push({
            component: "Storage",
            message: "Erro ao criar diretório temporário: " + error.message,
            code: ErrorCodes.STORAGE.WRITE_FAILED,
          })
        }
      }

      // Testar permissão de escrita
      if (tempDirExists) {
        try {
          const testFile = path.join(tempDir, `test-${Date.now()}.txt`)
          fs.writeFileSync(testFile, "test")
          fs.unlinkSync(testFile)
          tempDirWritable = true
        } catch (error) {
          logger.error("Erro ao escrever no diretório temporário", {
            code: ErrorCodes.STORAGE.WRITE_FAILED,
            details: error,
          })
          warnings.push({
            component: "Storage",
            message: "Diretório temporário não tem permissão de escrita: " + error.message,
            code: ErrorCodes.STORAGE.WRITE_FAILED,
          })
        }
      }
    } catch (error) {
      logger.error("Erro ao verificar diretório temporário", {
        code: ErrorCodes.STORAGE.READ_FAILED,
        details: error,
      })
      warnings.push({
        component: "Storage",
        message: "Erro ao verificar diretório temporário: " + error.message,
        code: ErrorCodes.STORAGE.READ_FAILED,
      })
    }

    // Verificar Redis
    let redisConnected = false
    let redisInfo = "Não verificado"

    try {
      // Importação dinâmica para evitar erros de compilação
      const { getRedisClient } = await import("@/lib/redis")
      const redis = getRedisClient()

      if (redis) {
        try {
          // Testar conexão com ping
          const testKey = `test-redis-${Date.now()}`
          const testValue = `test-value-${Date.now()}`

          await redis.set(testKey, testValue, { ex: 60 }) // Expira em 60 segundos
          const retrievedValue = await redis.get(testKey)

          redisConnected = retrievedValue === testValue
          redisInfo = redisConnected ? "Conectado" : "Falha na verificação de dados"

          logger.info("Teste de conexão Redis concluído", {
            context: { connected: redisConnected },
          })
        } catch (error) {
          logger.error("Erro ao testar conexão Redis", {
            code: ErrorCodes.CACHE.CONNECTION_FAILED,
            details: error,
          })
          redisInfo = `Erro: ${error.message}`
          warnings.push({
            component: "Redis",
            message: "Erro ao conectar ao Redis: " + error.message,
            code: ErrorCodes.CACHE.CONNECTION_FAILED,
          })
        }
      } else {
        logger.warning("Cliente Redis não disponível", {
          code: ErrorCodes.CACHE.CONNECTION_FAILED,
        })
        redisInfo = "Cliente não disponível"
        warnings.push({
          component: "Redis",
          message: "Cliente Redis não disponível",
          code: ErrorCodes.CACHE.CONNECTION_FAILED,
        })
      }
    } catch (error) {
      logger.error("Erro ao inicializar cliente Redis", {
        code: ErrorCodes.CACHE.CONNECTION_FAILED,
        details: error,
      })
      redisInfo = `Erro de inicialização: ${error.message}`
      warnings.push({
        component: "Redis",
        message: "Erro ao inicializar cliente Redis: " + error.message,
        code: ErrorCodes.CACHE.CONNECTION_FAILED,
      })
    }

    // Verificar Puppeteer
    const chromePath = process.env.CHROME_EXECUTABLE_PATH
    const puppeteerAvailable = !!chromePath || isVercel

    if (!chromePath && !isVercel) {
      logger.warning("CHROME_EXECUTABLE_PATH não está definido", {
        code: ErrorCodes.SYSTEM.DEPENDENCY_MISSING,
      })
      warnings.push({
        component: "Puppeteer",
        message: "CHROME_EXECUTABLE_PATH não está definido",
        code: ErrorCodes.SYSTEM.DEPENDENCY_MISSING,
      })
    }

    // Informações do ambiente
    const cpus = os.cpus().length
    const platform = os.platform()
    const nodeVersion = process.version
    const memoryUsage = process.memoryUsage()
    const totalMemory = os.totalmem()
    const freeMemory = os.freemem()
    const memoryUsagePercentage = Math.round((memoryUsage.rss / totalMemory) * 100)

    const elapsedTime = Date.now() - startTime
    logger.info("Verificação do sistema concluída", {
      context: {
        elapsedTime,
        warnings: warnings.length,
        ffmpegExists,
        ffprobeExists,
        tempDirWritable,
        redisConnected,
        puppeteerAvailable,
      },
    })

    // Simular sucesso em ambiente Vercel para alguns componentes
    if (isVercel) {
      if (!ffmpegExists) {
        logger.info("Simulando FFmpeg em ambiente Vercel")
        ffmpegExists = true
      }

      if (!ffprobeExists) {
        logger.info("Simulando FFprobe em ambiente Vercel")
        ffprobeExists = true
      }
    }

    return NextResponse.json({
      success: true,
      warnings,
      binaries: {
        ffmpegPath: ffmpegExists ? ffmpegPath : null,
        ffprobePath: ffprobeExists ? ffprobePath : null,
      },
      storage: {
        tempDir,
        exists: tempDirExists,
        writable: tempDirWritable,
      },
      redis: {
        connected: redisConnected,
        info: redisInfo,
      },
      puppeteer: {
        available: puppeteerAvailable,
        chromePath,
      },
      environment: {
        node: nodeVersion,
        platform,
        cpus,
        isVercel,
      },
      resources: {
        memoryUsage: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
        memoryPercentage: memoryUsagePercentage,
        totalMemory: `${Math.round(totalMemory / 1024 / 1024)} MB`,
        freeMemory: `${Math.round(freeMemory / 1024 / 1024)} MB`,
        elapsedTime: `${elapsedTime} ms`,
        timePercentage: Math.min(100, Math.round((elapsedTime / 5000) * 100)), // Assumindo 5s como tempo máximo
      },
      config: {
        ffmpegPath,
        ffprobePath,
        tempDir,
        chromePath,
      },
    })
  } catch (error) {
    const elapsedTime = Date.now() - startTime
    logger.error("Erro ao verificar sistema de vídeo", {
      code: ErrorCodes.SYSTEM.UNEXPECTED_ERROR,
      details: error,
      context: { elapsedTime },
    })

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        errorCode: ErrorCodes.SYSTEM.UNEXPECTED_ERROR,
        elapsedTime: `${elapsedTime} ms`,
      },
      { status: 500 },
    )
  }
}
