import { NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"

const logger = createLogger("API:PublishedVideos")

export async function GET() {
  try {
    // Como não temos mais Redis, retornamos uma lista vazia
    return NextResponse.json({
      success: true,
      videos: [],
      message: "Funcionalidade de listagem de vídeos publicados não está disponível sem armazenamento persistente",
    })
  } catch (error: any) {
    logger.error("Erro ao buscar vídeos publicados:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Falha ao buscar vídeos publicados: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
