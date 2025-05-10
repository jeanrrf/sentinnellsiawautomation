import { put, list, del } from "@vercel/blob"
import { getVideos } from "./redis"

// Prefixo para organizar os vídeos no Blob Storage
const VIDEO_PREFIX = "tiktok-videos/"

/**
 * Faz upload de um vídeo para o Blob Storage
 * @param videoBuffer Buffer do vídeo
 * @param filename Nome do arquivo
 * @returns URL do vídeo no Blob Storage
 */
export async function uploadVideo(videoBuffer: Buffer, filename: string): Promise<string> {
  try {
    // Garantir que o nome do arquivo tenha a extensão .mp4
    if (!filename.endsWith(".mp4")) {
      filename = `${filename}.mp4`
    }

    // Adicionar prefixo e timestamp para evitar colisões
    const blobFilename = `${VIDEO_PREFIX}${Date.now()}-${filename}`

    // Fazer upload para o Blob Storage
    const blob = await put(blobFilename, videoBuffer, {
      access: "public",
      contentType: "video/mp4",
    })

    console.log(`Vídeo enviado para o Blob Storage: ${blob.url}`)
    return blob.url
  } catch (error) {
    console.error("Erro ao fazer upload do vídeo para o Blob Storage:", error)
    throw error
  }
}

/**
 * Lista todos os vídeos armazenados no Blob Storage
 */
export async function listVideos() {
  try {
    const { blobs } = await list({ prefix: VIDEO_PREFIX })
    return blobs
  } catch (error) {
    console.error("Erro ao listar vídeos do Blob Storage:", error)
    return []
  }
}

/**
 * Exclui um vídeo do Blob Storage
 * @param url URL do vídeo no Blob Storage
 */
export async function deleteVideo(url: string): Promise<void> {
  try {
    await del(url)
    console.log(`Vídeo excluído do Blob Storage: ${url}`)
  } catch (error) {
    console.error("Erro ao excluir vídeo do Blob Storage:", error)
    throw error
  }
}

/**
 * Sincroniza os vídeos do Redis com o Blob Storage
 * Útil para migrar vídeos existentes
 */
export async function syncVideosWithBlobStorage(): Promise<void> {
  try {
    // Obter vídeos do Redis
    const videos = await getVideos()

    // Listar vídeos no Blob Storage
    const { blobs } = await list({ prefix: VIDEO_PREFIX })
    const blobUrls = blobs.map((blob) => blob.url)

    console.log(`Encontrados ${videos.length} vídeos no Redis e ${blobUrls.length} no Blob Storage`)

    // Para cada vídeo no Redis, verificar se já existe no Blob Storage
    // Se não existir e tivermos o HTML, podemos converter e fazer upload
    // Esta é uma funcionalidade avançada que pode ser implementada posteriormente

    return
  } catch (error) {
    console.error("Erro ao sincronizar vídeos com Blob Storage:", error)
  }
}
