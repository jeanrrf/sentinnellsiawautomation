import { NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"
import os from "os"

const logger = createLogger("API:SystemStatus")

export async function GET() {
  try {
    // Coletar informações do sistema
    const systemInfo = {
      platform: process.platform,
      nodeVersion: process.version,
      uptime: process.uptime(),
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        usage: (1 - os.freemem() / os.totalmem()) * 100,
      },
      cpu: os.cpus(),
      loadAvg: os.loadavg(),
    }

    // Verificar status dos serviços
    const services = {
      api: {
        status: "healthy",
        uptime: process.uptime(),
      },
      storage: {
        status: "healthy",
        type: "temporary",
        note: "Armazenamento temporário em memória (não persistente)",
      },
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      system: systemInfo,
      services,
    })
  } catch (error: any) {
    logger.error("Erro ao obter status do sistema:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Falha ao obter status do sistema: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
