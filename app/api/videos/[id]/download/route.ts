import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { kv } from "@vercel/kv"
import { Redis } from "@upstash/redis"

// Verificar se estamos no ambiente Vercel
const isVercel = process.env.VERCEL === "1"

// Configurar cliente Redis
let redis: Redis | null = null

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const productId = params.id

    // Verificar se o vídeo já existe no sistema de arquivos local (para desenvolvimento)
    const outputDir = path.join(process.cwd(), "output")
    const videoPath = path.join(outputDir, `video_${productId}.mp4`)

    // Buscar o template HTML do Redis
    const videoKey = `video:${productId}`
    let videoData: any = null

    if (redis) {
      videoData = await redis.get(videoKey)
    } else if (kv) {
      videoData = await kv.get(videoKey)
    }

    if (!videoData || !videoData.htmlTemplate) {
      return NextResponse.json({ success: false, message: "Vídeo não encontrado no cache" }, { status: 404 })
    }

    // Se o arquivo MP4 existe localmente e não estamos no Vercel, retorná-lo
    if (!isVercel && fs.existsSync(videoPath)) {
      const videoBuffer = fs.readFileSync(videoPath)

      return new NextResponse(videoBuffer, {
        headers: {
          "Content-Type": "video/mp4",
          "Content-Disposition": `attachment; filename="shopee_product_${productId}.mp4"`,
        },
      })
    }

    // Caso contrário, retornar o HTML como fallback
    return new NextResponse(videoData.htmlTemplate, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `attachment; filename="shopee_product_${productId}.html"`,
      },
    })
  } catch (error) {
    console.error("Erro ao processar download do vídeo:", error)
    return NextResponse.json({ success: false, message: "Erro ao processar download do vídeo" }, { status: 500 })
  }
}
