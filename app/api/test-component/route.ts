import { type NextRequest, NextResponse } from "next/server"
import { createLogger, ErrorCodes } from "@/lib/logger"
import fs from "fs/promises"
import path from "path"
import os from "os"

const logger = createLogger("API:TestComponent")

export async function GET(request: NextRequest) {
  const component = request.nextUrl.searchParams.get("component")
  logger.info(`Testando componente: ${component}`)

  if (!component) {
    return NextResponse.json(
      {
        success: false,
        message: "Componente não especificado",
        errorCode: ErrorCodes.VALIDATION.REQUIRED_FIELD,
      },
      { status: 400 },
    )
  }

  try {
    switch (component) {
      case "redis":
        return await testRedis()
      case "storage":
        return await testStorage()
      default:
        return NextResponse.json(
          {
            success: false,
            message: `Componente desconhecido: ${component}`,
            errorCode: ErrorCodes.VALIDATION.INVALID_FORMAT,
          },
          { status: 400 },
        )
    }
  } catch (error) {
    logger.error(`Erro ao testar componente ${component}:`, { details: error })
    return NextResponse.json(
      {
        success: false,
        message: `Erro ao testar componente: ${error.message}`,
        errorCode: ErrorCodes.SYSTEM.UNEXPECTED_ERROR,
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

async function testRedis() {
  try {
    // Importar de forma segura
    let isRedisAvailable
    try {
      const redis = await import("@/lib/redis")
      isRedisAvailable = redis.isRedisAvailable || (async () => false)
    } catch (importError) {
      logger.warning("Não foi possível importar o módulo Redis:", { details: importError })
      return NextResponse.json({
        success: false,
        message: "Não foi possível importar o módulo Redis",
        errorCode: ErrorCodes.SYSTEM.DEPENDENCY_MISSING,
        details: { error: importError.message },
      })
    }

    const isConnected = await isRedisAvailable().catch(() => false)

    if (isConnected) {
      return NextResponse.json({
        success: true,
        message: "Conexão com Redis estabelecida com sucesso",
      })
    } else {
      return NextResponse.json({
        success: false,
        message: "Não foi possível conectar ao Redis",
        errorCode: ErrorCodes.CACHE.CONNECTION_FAILED,
      })
    }
  } catch (error) {
    logger.error("Erro ao testar Redis:", { details: error })
    return NextResponse.json({
      success: false,
      message: `Erro ao testar Redis: ${error.message}`,
      errorCode: ErrorCodes.CACHE.CONNECTION_FAILED,
      details: { error: error.message, stack: process.env.NODE_ENV === "development" ? error.stack : undefined },
    })
  }
}

async function testStorage() {
  try {
    const tempDir = process.env.TEMP_DIR || path.join(os.tmpdir(), "shopee-tiktok-test")
    const testFile = path.join(tempDir, `test-file-${Date.now()}.txt`)
    const testContent = `Test content ${Date.now()}`

    // Verificar se o diretório existe
    try {
      await fs.access(tempDir)
    } catch {
      // Criar diretório se não existir
      await fs.mkdir(tempDir, { recursive: true })
    }

    // Testar escrita
    await fs.writeFile(testFile, testContent)

    // Testar leitura
    const content = await fs.readFile(testFile, "utf-8")
    const readSuccess = content === testContent

    // Testar exclusão
    await fs.unlink(testFile)

    if (readSuccess) {
      return NextResponse.json({
        success: true,
        message: "Sistema de arquivos operacional",
        details: { tempDir, testFile },
      })
    } else {
      return NextResponse.json({
        success: false,
        message: "Conteúdo lido não corresponde ao conteúdo escrito",
        errorCode: ErrorCodes.STORAGE.READ_FAILED,
        details: { tempDir, testFile, expected: testContent, actual: content },
      })
    }
  } catch (error) {
    logger.error("Erro ao testar armazenamento:", { details: error })
    return NextResponse.json({
      success: false,
      message: `Erro ao testar armazenamento: ${error.message}`,
      errorCode: ErrorCodes.STORAGE.WRITE_FAILED,
      details: { error: error.message, stack: process.env.NODE_ENV === "development" ? error.stack : undefined },
    })
  }
}
