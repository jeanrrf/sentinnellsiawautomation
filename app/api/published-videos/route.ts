import { NextResponse } from "next/server"
import { getPublishedVideos } from "@/lib/redis"

export async function GET() {
  try {
    // Obter todos os vídeos publicados
    const videos = await getPublishedVideos()

    return NextResponse.json({
      success: true,
      videos,
    })
  } catch (error: any) {
    console.error("Erro ao buscar vídeos publicados:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Falha ao buscar vídeos publicados: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
