import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { redis } from "@/lib/redis"
import { CACHE_KEYS } from "@/lib/constants"

// Check if we're in a Vercel environment
const isVercel = process.env.VERCEL === "1"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const productId = params.id

    // In Vercel, we can't serve files from the filesystem
    if (isVercel) {
      // Return a mock response or redirect to a placeholder video
      return NextResponse.json({
        success: false,
        message: "Video serving is not available in the deployed environment",
        note: "This feature requires a server with file system access and is only available in local development.",
      })
    }

    const videoPath = path.join(process.cwd(), "output", `video_${productId}.mp4`)

    if (!fs.existsSync(videoPath)) {
      return NextResponse.json({ success: false, message: "Video not found" }, { status: 404 })
    }

    const videoBuffer = fs.readFileSync(videoPath)

    return new NextResponse(videoBuffer, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `inline; filename="shopee_product_${productId}.mp4"`,
      },
    })
  } catch (error) {
    console.error("Error serving video:", error)
    return NextResponse.json({ success: false, message: "Failed to serve video" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const videoId = params.id

    // Buscar o vídeo para obter a URL do Blob antes de excluir
    const video = await redis.get(`${CACHE_KEYS.VIDEO_PREFIX}${videoId}`)
    let videoData

    if (video) {
      try {
        videoData = typeof video === "string" ? JSON.parse(video) : video
      } catch (error) {
        console.error(`Erro ao analisar dados do vídeo ${videoId}:`, error)
      }
    }

    // Remover do Redis
    await redis.srem(CACHE_KEYS.VIDEOS, videoId)
    await redis.del(`${CACHE_KEYS.VIDEO_PREFIX}${videoId}`)

    return NextResponse.json({
      success: true,
      message: "Vídeo excluído com sucesso",
    })
  } catch (error) {
    console.error("Erro ao excluir vídeo:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro ao excluir vídeo",
      },
      { status: 500 },
    )
  }
}
