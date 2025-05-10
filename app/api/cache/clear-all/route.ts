import { NextResponse } from "next/server"
import redis, { CACHE_KEYS } from "@/lib/redis"
import { cleanupOldVideos, cleanupTempFiles } from "@/lib/video-manager"

export async function POST() {
  try {
    console.log("Iniciando limpeza completa do cache...")

    // Limpar produtos
    await redis.del(CACHE_KEYS.PRODUCTS)
    console.log("Cache de produtos limpo")

    // Limpar vídeos (manter apenas o mais recente)
    await cleanupOldVideos()

    // Limpar arquivos temporários
    await cleanupTempFiles()

    // Limpar IDs processados
    await redis.del(CACHE_KEYS.PROCESSED_IDS)
    console.log("Cache de IDs processados limpo")

    return NextResponse.json({
      success: true,
      message: "Cache limpo com sucesso",
    })
  } catch (error) {
    console.error("Erro ao limpar cache:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Erro ao limpar cache: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
