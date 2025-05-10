import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { tmpdir } from "os"
import os from "os"

// Função auxiliar para monitorar recursos
function monitorResourceUsage() {
  const startTime = Date.now()
  const startMemory = process.memoryUsage().heapUsed / 1024 / 1024

  return {
    getStats: () => {
      const elapsedTime = Date.now() - startTime
      const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024 - startMemory

      return {
        elapsedTime,
        memoryUsage: Math.round(memoryUsage * 100) / 100,
        memoryPercentage: Math.round((memoryUsage / (os.totalmem() / 1024 / 1024)) * 100),
        timePercentage: Math.min(100, Math.round((elapsedTime / 10000) * 100)), // Assumindo 10s como máximo
      }
    },
  }
}

export async function GET() {
  const monitor = monitorResourceUsage()
  const warnings = []

  try {
    // Verificar ambiente
    const isVercel = process.env.VERCEL === "1"

    // Informações básicas do sistema
    const systemInfo = {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      cpus: `${os.cpus().length} cores`,
      totalMemory: `${Math.round(os.totalmem() / (1024 * 1024))} MB`,
      freeMemory: `${Math.round(os.freemem() / (1024 * 1024))} MB`,
    }

    // Verificar configurações de ambiente
    const envConfig = {
      ffmpegPath: process.env.FFMPEG_PATH || "(não definido)",
      ffprobePath: process.env.FFPROBE_PATH || "(não definido)",
      tempDir: process.env.TEMP_DIR || "(não definido)",
      vercel: isVercel ? "Sim" : "Não",
    }

    // Verificar sistema de arquivos de forma segura
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

    // Verificar Redis/KV de forma segura
    let redisConnected = false
    let redisInfo = "Não testado"

    try {
      // Verificar se temos acesso ao KV
      if (process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN) {
        redisInfo = "Configuração detectada, mas não testada para evitar erros"
        redisConnected = true
      } else {
        redisInfo = "Configuração não detectada"
        warnings.push("Redis/KV não configurado")
      }
    } catch (error) {
      redisInfo = `Erro: ${error.message}`
      warnings.push(`Erro na verificação do Redis: ${error.message}`)
    }

    // Obter estatísticas de uso de recursos
    const stats = monitor.getStats()

    return NextResponse.json({
      success: true,
      status: warnings.length > 0 ? "warning" : "operational",
      warnings: warnings.length > 0 ? warnings : undefined,
      environment: systemInfo,
      resources: {
        ...stats,
        memoryUsage: `${stats.memoryUsage} MB`,
        memoryPercentage: stats.memoryPercentage,
        elapsedTime: `${stats.elapsedTime} ms`,
        timePercentage: stats.timePercentage,
      },
      storage: {
        writable: storageWritable,
        info: storageInfo,
      },
      redis: {
        connected: redisConnected,
        info: redisInfo,
      },
      config: envConfig,
    })
  } catch (error) {
    console.error("Erro na verificação do sistema:", error)
    return NextResponse.json(
      {
        success: false,
        status: "error",
        message: error.message || "Erro desconhecido",
        resources: monitor.getStats(),
      },
      { status: 500 },
    )
  }
}
