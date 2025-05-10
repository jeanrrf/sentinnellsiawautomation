import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { tmpdir } from "os"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const component = searchParams.get("component")

  if (!component) {
    return NextResponse.json({ success: false, message: "Componente não especificado" }, { status: 400 })
  }

  try {
    switch (component) {
      case "ffmpeg":
        return await testFfmpeg()
      case "puppeteer":
        return await testPuppeteer()
      case "redis":
        return await testRedis()
      case "storage":
        return await testStorage()
      default:
        return NextResponse.json({ success: false, message: `Componente desconhecido: ${component}` }, { status: 400 })
    }
  } catch (error) {
    console.error(`Erro ao testar componente ${component}:`, error)
    return NextResponse.json(
      {
        success: false,
        message: `Erro ao testar ${component}`,
        details: error.message || "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}

async function testFfmpeg() {
  try {
    // Verificar se o FFMPEG_PATH está definido
    const ffmpegPath = process.env.FFMPEG_PATH

    if (!ffmpegPath) {
      return NextResponse.json({
        success: false,
        message: "FFMPEG_PATH não está definido nas variáveis de ambiente",
      })
    }

    // Verificar se o arquivo existe, mas de forma segura
    let exists = false
    let isExecutable = false

    try {
      exists = fs.existsSync(ffmpegPath)
      if (exists) {
        const stats = fs.statSync(ffmpegPath)
        isExecutable = !!(stats.mode & 0o111)
      }
    } catch (err) {
      // Ignorar erros de acesso ao sistema de arquivos
    }

    return NextResponse.json({
      success: true,
      message: "Verificação de FFmpeg concluída",
      details: {
        path: ffmpegPath,
        exists,
        isExecutable,
      },
    })
  } catch (error) {
    throw error
  }
}

async function testPuppeteer() {
  try {
    // Verificar se o CHROME_EXECUTABLE_PATH está definido
    const chromePath = process.env.CHROME_EXECUTABLE_PATH

    return NextResponse.json({
      success: true,
      message: "Verificação de Puppeteer concluída",
      details: {
        chromePath: chromePath || "(não definido)",
        available: !!chromePath,
      },
    })
  } catch (error) {
    throw error
  }
}

async function testRedis() {
  try {
    // Verificar se as variáveis de ambiente do Redis estão definidas
    const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL || process.env.KV_URL
    const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN

    return NextResponse.json({
      success: true,
      message: "Verificação de Redis concluída",
      details: {
        configured: !!(redisUrl || redisToken),
        url: redisUrl ? "Configurado" : "Não configurado",
        token: redisToken ? "Configurado" : "Não configurado",
      },
    })
  } catch (error) {
    throw error
  }
}

async function testStorage() {
  try {
    // Testar acesso ao sistema de arquivos temporário
    const tmpDir = process.env.TEMP_DIR || path.join(tmpdir(), "shopee-tiktok-test")
    let dirExists = false
    let writeSuccess = false
    let readSuccess = false

    try {
      // Verificar se o diretório existe
      dirExists = fs.existsSync(tmpDir)

      // Criar diretório se não existir
      if (!dirExists) {
        fs.mkdirSync(tmpDir, { recursive: true })
        dirExists = true
      }

      // Testar escrita
      const testFile = path.join(tmpDir, `test-file-${Date.now()}.txt`)
      const testContent = `Test content ${Date.now()}`

      fs.writeFileSync(testFile, testContent)
      writeSuccess = true

      // Testar leitura
      const readContent = fs.readFileSync(testFile, "utf-8")
      readSuccess = readContent === testContent

      // Limpar
      fs.unlinkSync(testFile)
    } catch (err) {
      // Ignorar erros de acesso ao sistema de arquivos
    }

    return NextResponse.json({
      success: true,
      message: "Verificação de armazenamento concluída",
      details: {
        tempDir: tmpDir,
        dirExists,
        writeSuccess,
        readSuccess,
      },
    })
  } catch (error) {
    throw error
  }
}
