/**
 * Verifica se um blob de vídeo é válido e pode ser reproduzido
 * @param videoBlob O blob de vídeo a ser verificado
 * @returns Uma promessa que resolve para true se o vídeo for válido, ou false caso contrário
 */
export async function isValidVideoBlob(videoBlob: Blob): Promise<boolean> {
  // Verificar se o blob tem um tipo de mídia de vídeo
  if (!videoBlob.type.startsWith("video/")) {
    console.warn("Blob não é do tipo vídeo:", videoBlob.type)
    return false
  }

  // Verificar se o blob tem tamanho
  if (videoBlob.size === 0) {
    console.warn("Blob de vídeo tem tamanho zero")
    return false
  }

  // Criar um URL para o blob
  const url = URL.createObjectURL(videoBlob)

  try {
    // Criar um elemento de vídeo para testar a reprodução
    const video = document.createElement("video")

    // Criar uma promessa que resolve quando o vídeo pode ser reproduzido
    const canPlay = new Promise<boolean>((resolve) => {
      // Configurar handlers de eventos
      video.onloadedmetadata = () => resolve(true)
      video.onerror = () => {
        console.error("Erro ao carregar vídeo:", video.error)
        resolve(false)
      }

      // Definir um timeout para evitar esperar indefinidamente
      setTimeout(() => resolve(false), 3000)
    })

    // Definir a fonte do vídeo
    video.src = url
    video.load()

    // Aguardar o resultado
    return await canPlay
  } catch (error) {
    console.error("Erro ao validar blob de vídeo:", error)
    return false
  } finally {
    // Limpar o URL do blob
    URL.revokeObjectURL(url)
  }
}

/**
 * Cria um vídeo de fallback para quando o vídeo principal falha
 * @returns Um blob contendo um vídeo de fallback
 */
export async function createFallbackVideo(): Promise<Blob> {
  // Esta função cria um vídeo de fallback simples usando canvas e MediaRecorder
  // Útil quando a geração de vídeo principal falha

  try {
    // Criar um canvas
    const canvas = document.createElement("canvas")
    canvas.width = 640
    canvas.height = 480
    const ctx = canvas.getContext("2d")

    if (!ctx) {
      throw new Error("Não foi possível obter contexto 2D do canvas")
    }

    // Configurar o MediaRecorder
    const stream = canvas.captureStream(30) // 30 FPS
    const recorder = new MediaRecorder(stream, { mimeType: "video/webm" })

    const chunks: Blob[] = []
    recorder.ondataavailable = (e) => chunks.push(e.data)

    // Criar uma promessa que resolve quando a gravação terminar
    const recordingPromise = new Promise<Blob>((resolve) => {
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" })
        resolve(blob)
      }
    })

    // Iniciar gravação
    recorder.start()

    // Desenhar alguns frames
    let frame = 0
    const maxFrames = 90 // 3 segundos a 30 FPS

    const drawFrame = () => {
      // Limpar o canvas
      ctx.fillStyle = "#000000"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Desenhar texto
      ctx.fillStyle = "#FFFFFF"
      ctx.font = "30px Arial"
      ctx.textAlign = "center"
      ctx.fillText("Vídeo de Fallback", canvas.width / 2, canvas.height / 2 - 40)
      ctx.fillText("Produto não disponível", canvas.width / 2, canvas.height / 2)
      ctx.fillText("Tente novamente", canvas.width / 2, canvas.height / 2 + 40)

      // Desenhar borda animada
      const hue = (frame * 2) % 360
      ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`
      ctx.lineWidth = 10
      ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40)

      frame++

      if (frame < maxFrames) {
        requestAnimationFrame(drawFrame)
      } else {
        recorder.stop()
      }
    }

    // Iniciar animação
    drawFrame()

    // Aguardar o fim da gravação
    return await recordingPromise
  } catch (error) {
    console.error("Erro ao criar vídeo de fallback:", error)
    // Retornar um blob vazio como último recurso
    return new Blob([], { type: "video/mp4" })
  }
}
