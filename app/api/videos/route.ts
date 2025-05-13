import { NextResponse } from "next/server"
import { getVideos } from "@/lib/redis"

export async function GET() {
  try {
    // Obter todos os vídeos não publicados
    const videos = await getVideos()

    return NextResponse.json({
      success: true,
      videos,
    })
  } catch (error: any) {
    console.error("Erro ao buscar vídeos:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Falha ao buscar vídeos: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
