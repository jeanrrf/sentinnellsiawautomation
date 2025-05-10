import fs from "fs"
import path from "path"
import { saveVideo, getVideos, CACHE_KEYS } from "./redis"
import redis from "./redis"

/**
 * Limpa todos os vídeos antigos, mantendo apenas o mais recente
 */
export async function cleanupOldVideos(): Promise<void> {
  try {
    console.log("Iniciando limpeza de vídeos antigos...")

    // Obter todos os vídeos
    const videos = await getVideos()

    if (videos.length <= 1) {
      console.log("Não há vídeos antigos para limpar")
      return
    }

    // Ordenar vídeos por data de criação (mais recente primeiro)
    const sortedVideos = videos.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime()
      const dateB = new Date(b.createdAt || 0).getTime()
      return dateB - dateA
    })

    // Manter apenas o vídeo mais recente
    const latestVideo = sortedVideos[0]
    const videosToRemove = sortedVideos.slice(1)

    console.log(`Mantendo vídeo mais recente: ${latestVideo.productId}`)
    console.log(`Removendo ${videosToRemove.length} vídeos antigos`)

    // Remover vídeos antigos do Redis
    for (const video of videosToRemove) {
      await redis.srem(CACHE_KEYS.VIDEOS, video.productId)
      await redis.del(`${CACHE_KEYS.VIDEO_PREFIX}${video.productId}`)

      // Remover arquivo de vídeo se existir
      if (video.videoPath && fs.existsSync(video.videoPath)) {
        fs.unlinkSync(video.videoPath)
        console.log(`Arquivo de vídeo removido: ${video.videoPath}`)
      }

      console.log(`Vídeo removido: ${video.productId}`)
    }

    console.log("Limpeza de vídeos antigos concluída com sucesso")
  } catch (error) {
    console.error("Erro ao limpar vídeos antigos:", error)
  }
}

/**
 * Limpa todos os arquivos temporários de vídeo
 */
export async function cleanupTempFiles(): Promise<void> {
  try {
    const tempDir = process.env.TEMP_DIR || path.join(process.cwd(), "tmp")

    if (!fs.existsSync(tempDir)) {
      console.log(`Diretório temporário não existe: ${tempDir}`)
      return
    }

    const files = fs.readdirSync(tempDir)

    for (const file of files) {
      // Manter apenas arquivos de vídeo e imagem
      if (file.endsWith(".mp4") || file.endsWith(".png") || file.endsWith(".jpg")) {
        const filePath = path.join(tempDir, file)
        fs.unlinkSync(filePath)
        console.log(`Arquivo temporário removido: ${filePath}`)
      }
    }

    console.log("Limpeza de arquivos temporários concluída com sucesso")
  } catch (error) {
    console.error("Erro ao limpar arquivos temporários:", error)
  }
}

/**
 * Salva um novo vídeo e limpa vídeos antigos
 */
export async function saveVideoAndCleanup(videoData: any): Promise<void> {
  try {
    // Adicionar data de criação se não existir
    if (!videoData.createdAt) {
      videoData.createdAt = new Date().toISOString()
    }

    // Salvar o novo vídeo
    await saveVideo(videoData)

    // Limpar vídeos antigos
    await cleanupOldVideos()

    // Limpar arquivos temporários
    await cleanupTempFiles()
  } catch (error) {
    console.error("Erro ao salvar vídeo e limpar antigos:", error)
    throw error
  }
}

export default {
  cleanupOldVideos,
  cleanupTempFiles,
  saveVideoAndCleanup,
}
