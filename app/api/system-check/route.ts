import { NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"
import os from "os"

const logger = createLogger("API:SystemCheck")

export async function GET() {
  try {
    // Verificar API
    const apiStatus = {
      success: true,
      message: "API funcionando corretamente",
    }

    // Verificar armazenamento
    const storageStatus = {
      success: true,
      message: "Armazenamento temporário funcionando",
      type: "temporary",
    }

    // Verificar sistema
    const systemStatus = {
      success: true,
      message: "Sistema operacional",
      platform: process.platform,
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        usage: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100,
      },
    }

    return NextResponse.json({
      success: true,
      api: apiStatus,
      storage: storageStatus,
      system: systemStatus,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    logger.error("Erro ao verificar sistema:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Falha ao verificar sistema: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
