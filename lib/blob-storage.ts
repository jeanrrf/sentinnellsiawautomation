import { put, list, del } from "@vercel/blob"
import { CACHE_KEYS } from "./constants"

// Função para fazer upload de um vídeo para o Blob Storage
export async function uploadVideoToBlob(videoBuffer: Buffer, productId: string, format = "mp4") {
  try {
    const filename = `video_${productId}_${Date.now()}.${format}`
    const blob = await put(filename, videoBuffer, {
      access: "public",
      contentType: `video/${format}`,
      addRandomSuffix: true,
    })

    console.log(`Video uploaded to Blob Storage: ${blob.url}`)
    return {
      success: true,
      url: blob.url,
      filename: blob.pathname,
    }
  } catch (error) {
    console.error("Error uploading video to Blob Storage:", error)
    return {
      success: false,
      error: error.message || "Unknown error",
    }
  }
}

// Função para listar todos os vídeos no Blob Storage
export async function listVideosFromBlob(prefix = CACHE_KEYS.VIDEO_PREFIX) {
  try {
    const { blobs } = await list({ prefix })
    return {
      success: true,
      videos: blobs.map((blob) => ({
        url: blob.url,
        filename: blob.pathname,
        size: blob.size,
        uploadedAt: blob.uploadedAt,
      })),
    }
  } catch (error) {
    console.error("Error listing videos from Blob Storage:", error)
    return {
      success: false,
      error: error.message || "Unknown error",
      videos: [],
    }
  }
}

// Função para excluir um vídeo do Blob Storage
export async function deleteVideoFromBlob(url: string) {
  try {
    await del(url)
    console.log(`Video deleted from Blob Storage: ${url}`)
    return {
      success: true,
    }
  } catch (error) {
    console.error("Error deleting video from Blob Storage:", error)
    return {
      success: false,
      error: error.message || "Unknown error",
    }
  }
}

// Função para limpar todos os vídeos do Blob Storage
export async function cleanupBlobStorage(prefix = CACHE_KEYS.VIDEO_PREFIX) {
  try {
    const { videos } = await listVideosFromBlob(prefix)

    if (!videos || videos.length === 0) {
      return {
        success: true,
        message: "No videos to clean up",
        count: 0,
      }
    }

    const deletePromises = videos.map((video) => deleteVideoFromBlob(video.url))
    const results = await Promise.all(deletePromises)

    const successCount = results.filter((result) => result.success).length

    return {
      success: true,
      message: `Deleted ${successCount} of ${videos.length} videos`,
      count: successCount,
    }
  } catch (error) {
    console.error("Error cleaning up Blob Storage:", error)
    return {
      success: false,
      error: error.message || "Unknown error",
      count: 0,
    }
  }
}

// Alias para compatibilidade com código existente
export const uploadVideo = uploadVideoToBlob

// Alias para compatibilidade com código existente
export const deleteVideo = deleteVideoFromBlob
