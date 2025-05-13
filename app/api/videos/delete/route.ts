import { NextResponse } from "next/server"
import redis, { CACHE_KEYS } from "@/lib/redis"

export async function POST(req: Request) {
  try {
    const { productId } = await req.json()

    if (!productId) {
      return NextResponse.json({ success: false, message: "ID do produto é obrigatório" }, { status: 400 })
    }

    // Remover o vídeo do conjunto de vídeos
    await redis.srem(CACHE_KEYS.VIDEOS, productId)

    // Remover os dados do vídeo
    await redis.del(`${CACHE_KEYS.VIDEO_PREFIX}${productId}`)

    // Remover da lista de produtos excluídos (opcional, se quiser permitir que o produto seja buscado novamente)
    // await redis.srem(CACHE_KEYS.EXCLUDED_PRODUCTS, productId)

    return NextResponse.json({
      success: true,
      message: "Vídeo excluído com sucesso",
    })
  } catch (error: any) {
    console.error("Erro ao excluir vídeo:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Falha ao excluir vídeo: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
