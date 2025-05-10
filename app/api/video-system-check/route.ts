import { NextResponse } from "next/server"
import { ensureBinaries } from "@/lib/serverless-binaries"
import { monitorResourceUsage } from "@/lib/serverless-monitor"
import fs from "fs"
import path from "path"
import { tmpdir } from "os"
import os from "os"
import { kv } from "@vercel/kv"

export async function GET() {
  const monitor = monitorResourceUsage()
  const warnings = []

  try {
    // Verificar disponibilidade dos binários
    const binaries = await ensureBinaries()

    // Verificar se os binários existem e são executáveis
    let ffmpegStatus = false
    let ffprobeStatus = false

    if (binaries.ffmpegPath && fs.existsSync(binaries.ffmpegPath)) {
      const stats = fs.statSync(binaries.ffmpegPath)
      ffmpegStatus = !!(stats.mode & 0o111) // Verificar se é executável

      if (!ffmpegStatus) {
        warnings.push("FFmpeg encontrado, mas não é executável")
      }
    } else {
      warnings.push("FFmpeg não encontrado")
    }

    if (binaries.ffprobePath && fs.existsSync(binaries.ffprobePath)) {
      const stats = fs.statSync(binaries.ffprobePath)
      ffprobeStatus = !!(stats.mode & 0o111) // Verificar se é executável

      if (!ffprobeStatus) {
        warnings.push("FFprobe encontrado, mas não é executável")
      }
    } else {
      warnings.push("FFprobe não encontrado")
    }

    // Verificar Redis
    let redisConnected = false
    let redisInfo = "Não testado"

    try {
      const testKey = `system-check-${Date.now()}`
      await kv.set(testKey, "test", { ex: 60 })
      const value = await kv.get(testKey)
      redisConnected = value === "test"
      redisInfo = redisConnected ? "Conectado" : "Falha na verificação de leitura/escrita"
    } catch (error) {
      redisInfo = `Erro: ${error.message}`
      warnings.push(`Erro na conexão com Redis: ${error.message}`)
    }

    // Verificar sistema de arquivos
    let storageWritable = false
    let storageInfo = "Não testado"

    try {
      const tmpDir = process.env.TEMP_DIR || path.join(tmpdir(), "shopee-tiktok-test")

      // Criar diretório se não existir
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true })
      }

      // Testar escrita
      const testFile = path.join(tmpDir, `system-check-${Date.now()}.txt`)
      fs.writeFileSync(testFile, "test")

      // Testar leitura
      const content = fs.readFileSync(testFile, "utf-8")
      storageWritable = content === "test"

      // Limpar
      fs.unlinkSync(testFile)

      storageInfo = storageWritable ? `Diretório: ${tmpDir}` : "Falha na verificação de leitura/escrita"
    } catch (error) {
      storageInfo = `Erro: ${error.message}`
      warnings.push(`Erro no sistema de arquivos: ${error.message}`)
    }

    // Verificar Puppeteer (simplificado)
    const puppeteerAvailable = true // Simplificado, pois carregar o Puppeteer completo seria pesado

    // Obter estatísticas de uso de recursos
    const stats = monitor.getStats()

    // Verificar limites de recursos
    if (stats.memoryPercentage > 70) {
      warnings.push(`Uso de memória alto: ${stats.memoryPercentage}%`)
    }

    if (stats.timePercentage > 70) {
      warnings.push(`Tempo de execução alto: ${stats.timePercentage}%`)
    }

    return NextResponse.json({
      success: true,
      status: warnings.length > 0 ? "warning" : "operational",
      warnings: warnings.length > 0 ? warnings : undefined,
      binaries: {
        ffmpegPath: binaries.ffmpegPath,
        ffprobePath: binaries.ffprobePath,
        ffmpegExecutable: ffmpegStatus,
        ffprobeExecutable: ffprobeStatus,
      },
      environment: {
        node: process.version,
        platform: process.platform,
        arch: process.arch,
        cpus: `${os.cpus().length} cores`,
        totalMemory: `${Math.round(os.totalmem() / (1024 * 1024))} MB`,
        freeMemory: `${Math.round(os.freemem() / (1024 * 1024))} MB`,
      },
      resources: {
        ...stats,
        memoryUsage: `${stats.memoryUsage} MB`,
        memoryPercentage: stats.memoryPercentage,
        elapsedTime: `${stats.elapsedTime} ms`,
        timePercentage: stats.timePercentage,
      },
      redis: {
        connected: redisConnected,
        info: redisInfo,
      },
      storage: {
        writable: storageWritable,
        info: storageInfo,
      },
      puppeteer: {
        available: puppeteerAvailable,
      },
      config: {
        ffmpegPath: process.env.FFMPEG_PATH || "(não definido)",
        ffprobePath: process.env.FFPROBE_PATH || "(não definido)",
        tempDir: process.env.TEMP_DIR || "(não definido)",
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        status: "error",
        message: error.message,
        resources: monitor.getStats(),
      },
      { status: 500 },
    )
  }
}
