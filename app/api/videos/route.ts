import { NextResponse } from "next/server"
import storageService from "@/lib/storage-service"
import { createLogger } from "@/lib/logger"

const logger = createLogger("API:Videos")

export async function GET() {
  try {
    // Obter todos os vídeos
    const videos = await storageService.getVideos()

    return NextResponse.json({
      success: true,
      videos,
    })
  } catch (error: any) {
    logger.error("Erro ao buscar vídeos:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Falha ao buscar vídeos: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
