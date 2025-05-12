import { NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"
import storageService from "@/lib/storage-service"

const logger = createLogger("API:PublishVideo")

export async function POST(request: Request) {
  try {
    const { videoId } = await request.json()

    if (!videoId) {
      return NextResponse.json(
        {
          success: false,
          message: "ID do vídeo é obrigatório",
        },
        { status: 400 },
      )
    }

    // Buscar todos os vídeos
    const videos = await storageService.getVideos()

    // Encontrar o vídeo pelo ID
    const video = videos.find((v) => v.id === videoId)

    if (!video) {
      return NextResponse.json(
        {
          success: false,
          message: "Vídeo não encontrado",
        },
        { status: 404 },
      )
    }

    // Atualizar o status do vídeo para "published"
    video.status = "published"

    // Salvar o vídeo atualizado
    await storageService.saveVideo(video)

    return NextResponse.json({
      success: true,
      message: "Vídeo publicado com sucesso",
      video,
    })
  } catch (error: any) {
    logger.error("Erro ao publicar vídeo:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Falha ao publicar vídeo: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
