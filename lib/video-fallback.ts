import { createLogger, ErrorCodes } from "@/lib/logger"

const logger = createLogger("VideoFallback")

/**
 * Cria um vídeo de fallback quando o vídeo principal não pode ser reproduzido
 */
export async function createFallbackVideo(message = "Vídeo não disponível"): Promise<string> {
  try {
    logger.debug("Creating fallback video")

    // Criar um canvas
    const canvas = document.createElement("canvas")
    canvas.width = 540 // Metade de 1080 para melhor performance
    canvas.height = 960 // Metade de 1920 para relação 9:16
    const ctx = canvas.getContext("2d")

    if (!ctx) {
      throw new Error("Não foi possível obter contexto 2D do canvas")
    }

    // Desenhar fundo preto
    ctx.fillStyle = "#000000"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Desenhar texto de erro
    ctx.fillStyle = "#FFFFFF"
    ctx.font = "bold 24px Arial"
    ctx.textAlign = "center"
    ctx.fillText(message, canvas.width / 2, canvas.height / 2 - 40)
    ctx.font = "16px Arial"
    ctx.fillText("Por favor, tente novamente ou", canvas.width / 2, canvas.height / 2)
    ctx.fillText("entre em contato com o suporte", canvas.width / 2, canvas.height / 2 + 25)

    // Desenhar borda
    ctx.strokeStyle = "#FF0000"
    ctx.lineWidth = 5
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40)

    // Converter canvas para blob
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            logger.debug("Fallback image created successfully", {
              context: { size: blob.size, type: blob.type },
            })
            const url = URL.createObjectURL(blob)
            resolve(url)
          } else {
            logger.error("Failed to create fallback image blob", {
              code: ErrorCodes.VIDEO.GENERATION_FAILED,
            })
            reject(new Error("Falha ao criar imagem de fallback"))
          }
        },
        "image/jpeg",
        0.9,
      )
    })
  } catch (error) {
    logger.error("Error creating fallback video", {
      code: ErrorCodes.VIDEO.GENERATION_FAILED,
      details: error,
    })

    // Retornar uma URL para uma imagem de erro padrão
    return "/error-message.png"
  }
}

/**
 * Tenta reproduzir um vídeo para testar se ele é válido
 */
export function testVideoPlayback(videoUrl: string): Promise<boolean> {
  return new Promise((resolve) => {
    const video = document.createElement("video")

    video.onloadedmetadata = () => {
      logger.debug("Video metadata loaded successfully")
      resolve(true)
    }

    video.oncanplay = () => {
      logger.debug("Video can play successfully")
      resolve(true)
    }

    video.onerror = (e) => {
      logger.error("Video playback test failed", {
        code: ErrorCodes.VIDEO.PLAYBACK_FAILED,
        context: {
          error: video.error?.message || "Unknown error",
          code: video.error?.code,
        },
      })
      resolve(false)
    }

    // Set timeout
    const timeout = setTimeout(() => {
      logger.warning("Video playback test timed out", {
        code: ErrorCodes.VIDEO.PLAYBACK_TIMEOUT,
      })
      video.src = ""
      video.load()
      resolve(false)
    }, 5000)

    // Clean up on success
    video.oncanplay = () => {
      clearTimeout(timeout)
      resolve(true)
    }

    video.src = videoUrl
    video.load()
  })
}
