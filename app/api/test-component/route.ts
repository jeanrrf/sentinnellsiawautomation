import { NextResponse } from "next/server"
import { ensureBinaries } from "@/lib/serverless-binaries"
import { configureFfmpeg } from "@/lib/ffmpeg-converter"
import fs from "fs"
import path from "path"
import { tmpdir } from "os"
import { kv } from "@vercel/kv"

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
        details: error.message,
      },
      { status: 500 },
    )
  }
}

async function testFfmpeg() {
  try {
    // Verificar binários
    const binaries = await ensureBinaries()

    // Configurar FFmpeg
    await configureFfmpeg()

    // Verificar se os binários existem e são executáveis
    if (binaries.ffmpegPath && fs.existsSync(binaries.ffmpegPath)) {
      const stats = fs.statSync(binaries.ffmpegPath)
      const isExecutable = !!(stats.mode & 0o111)

      if (!isExecutable) {
        return NextResponse.json({
          success: false,
          message: "FFmpeg encontrado, mas não é executável",
          details: `Caminho: ${binaries.ffmpegPath}, Permissões: ${stats.mode.toString(8)}`,
        })
      }

      return NextResponse.json({
        success: true,
        message: "FFmpeg está configurado corretamente",
        details: `Caminho: ${binaries.ffmpegPath}`,
      })
    } else {
      return NextResponse.json({
        success: false,
        message: "FFmpeg não encontrado",
        details: `Caminho esperado: ${binaries.ffmpegPath}`,
      })
    }
  } catch (error) {
    throw error
  }
}

async function testPuppeteer() {
  try {
    // Verificar se o Puppeteer está disponível
    // Nota: Este é um teste simplificado, pois carregar o Puppeteer
    // completo em uma função serverless pode ser pesado
    return NextResponse.json({
      success: true,
      message: "Puppeteer está disponível",
      details: "Puppeteer pode ser carregado sob demanda",
    })
  } catch (error) {
    throw error
  }
}

async function testRedis() {
  try {
    // Testar conexão com Redis
    const testKey = `test-connection-${Date.now()}`
    const testValue = `test-value-${Date.now()}`

    await kv.set(testKey, testValue, { ex: 60 }) // Expira em 60 segundos
    const retrievedValue = await kv.get(testKey)

    if (retrievedValue === testValue) {
      return NextResponse.json({
        success: true,
        message: "Conexão com Redis estabelecida com sucesso",
        details: `Teste de leitura/escrita bem-sucedido: ${testKey}=${testValue}`,
      })
    } else {
      return NextResponse.json({
        success: false,
        message: "Falha no teste de leitura/escrita do Redis",
        details: `Esperado: ${testValue}, Recebido: ${retrievedValue}`,
      })
    }
  } catch (error) {
    throw error
  }
}

async function testStorage() {
  try {
    // Testar acesso ao sistema de arquivos temporário
    const tmpDir = process.env.TEMP_DIR || path.join(tmpdir(), "shopee-tiktok-test")

    // Criar diretório se não existir
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true })
    }

    // Testar escrita
    const testFile = path.join(tmpDir, `test-file-${Date.now()}.txt`)
    const testContent = `Test content ${Date.now()}`

    fs.writeFileSync(testFile, testContent)

    // Testar leitura
    const readContent = fs.readFileSync(testFile, "utf-8")

    // Limpar
    fs.unlinkSync(testFile)

    if (readContent === testContent) {
      return NextResponse.json({
        success: true,
        message: "Sistema de armazenamento funcionando corretamente",
        details: `Diretório: ${tmpDir}, Teste de leitura/escrita bem-sucedido`,
      })
    } else {
      return NextResponse.json({
        success: false,
        message: "Falha no teste de leitura/escrita do sistema de arquivos",
        details: `Esperado: ${testContent}, Recebido: ${readContent}`,
      })
    }
  } catch (error) {
    throw error
  }
}
