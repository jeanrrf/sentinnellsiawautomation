/**
 * Gerador de cards com efeito de transição entre múltiplas imagens
 * Versão aprimorada do canvas-card-generator.ts
 */

import { type CardConfig, DEFAULT_CARD_CONFIG } from "@/lib/canvas-card-generator"

// Tipos para configuração da transição de imagens
export interface TransitionConfig {
  enabled: boolean
  duration: number // Duração de cada imagem em ms
  transitionTime: number // Tempo de transição entre imagens em ms
  effect: "fade" | "slide" | "zoom" // Tipo de efeito de transição
}

// Configuração padrão para transição
export const DEFAULT_TRANSITION_CONFIG: TransitionConfig = {
  enabled: true,
  duration: 1500, // 1.5 segundos por imagem
  transitionTime: 500, // 0.5 segundos de transição
  effect: "fade",
}

/**
 * Gera um card com transição de múltiplas imagens
 * @param product Dados do produto
 * @param description Descrição do produto
 * @param images Array de URLs das imagens do produto
 * @param config Configuração do card
 * @param transitionConfig Configuração da transição
 * @returns Promise com array de frames para animação
 */
export async function generateMultiImageCard(
  product: any,
  description: string,
  images: string[],
  config: Partial<CardConfig> = {},
  transitionConfig: Partial<TransitionConfig> = {},
): Promise<Blob[]> {
  // Mesclar configurações com valores padrão
  const finalConfig: CardConfig = { ...DEFAULT_CARD_CONFIG, ...config }
  const finalTransitionConfig: TransitionConfig = { ...DEFAULT_TRANSITION_CONFIG, ...transitionConfig }

  // Garantir que temos pelo menos uma imagem
  if (!images || images.length === 0) {
    images = [product.imageUrl || "/placeholder.svg"]
  }

  // Se temos apenas uma imagem, gerar um card estático
  if (images.length === 1 || !finalTransitionConfig.enabled) {
    return generateStaticCard(product, description, images[0], finalConfig)
  }

  // Implementação para gerar frames para a animação
  return generateTransitionFrames(product, description, images, finalConfig, finalTransitionConfig)
}

/**
 * Gera um card estático (sem transição)
 */
async function generateStaticCard(
  product: any,
  description: string,
  imageUrl: string,
  config: CardConfig,
): Promise<Blob[]> {
  return new Promise((resolve, reject) => {
    try {
      // Criar canvas com as dimensões especificadas
      const canvas = document.createElement("canvas")
      canvas.width = config.width
      canvas.height = config.height
      const ctx = canvas.getContext("2d")

      if (!ctx) {
        throw new Error("Failed to get canvas context")
      }

      // Carregar a imagem
      const image = new Image()
      image.crossOrigin = "anonymous"

      image.onload = () => {
        // Renderizar o card
        renderCardContent(ctx, image, product, description, config)

        // Converter canvas para blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve([blob]) // Retornar um array com uma única blob
            } else {
              reject(new Error("Failed to convert canvas to blob"))
            }
          },
          config.format === "png" ? "image/png" : "image/jpeg",
          config.format === "png" ? undefined : config.quality,
        )
      }

      image.onerror = () => {
        reject(new Error(`Failed to load image: ${imageUrl}`))
      }

      image.src = imageUrl
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Gera frames para animação de transição entre imagens
 */
async function generateTransitionFrames(
  product: any,
  description: string,
  images: string[],
  config: CardConfig,
  transitionConfig: TransitionConfig,
): Promise<Blob[]> {
  // Determinar o número de frames por transição
  const framesPerTransition = Math.ceil((transitionConfig.transitionTime / 1000) * 30) // 30fps
  const totalFrames = images.length * (framesPerTransition + 1) // +1 para o frame estático de cada imagem

  // Carregar todas as imagens
  const loadedImages = await Promise.all(
    images.map(
      (url) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image()
          img.crossOrigin = "anonymous"
          img.onload = () => resolve(img)
          img.onerror = () => reject(new Error(`Failed to load image: ${url}`))
          img.src = url
        }),
    ),
  )

  // Criar canvas
  const canvas = document.createElement("canvas")
  canvas.width = config.width
  canvas.height = config.height
  const ctx = canvas.getContext("2d")

  if (!ctx) {
    throw new Error("Failed to get canvas context")
  }

  // Array para armazenar os frames gerados
  const frames: Blob[] = []

  // Gerar um frame para cada imagem estática e transições entre elas
  for (let i = 0; i < loadedImages.length; i++) {
    const currentImage = loadedImages[i]
    const nextImage = loadedImages[(i + 1) % loadedImages.length]

    // Frame estático para a imagem atual
    renderCardContent(ctx, currentImage, product, description, config)

    const staticBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error("Failed to create blob from canvas"))
        },
        config.format === "png" ? "image/png" : "image/jpeg",
        config.format === "png" ? undefined : config.quality,
      )
    })

    frames.push(staticBlob)

    // Frames de transição para a próxima imagem
    for (let frame = 1; frame <= framesPerTransition; frame++) {
      const progress = frame / framesPerTransition // 0 a 1

      // Aplicar o efeito de transição escolhido
      switch (transitionConfig.effect) {
        case "fade":
          renderFadeTransition(ctx, currentImage, nextImage, progress, product, description, config)
          break
        case "slide":
          renderSlideTransition(ctx, currentImage, nextImage, progress, product, description, config)
          break
        case "zoom":
          renderZoomTransition(ctx, currentImage, nextImage, progress, product, description, config)
          break
        default:
          renderFadeTransition(ctx, currentImage, nextImage, progress, product, description, config)
      }

      // Adicionar o frame ao array
      const frameBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob)
            else reject(new Error("Failed to create blob from canvas"))
          },
          config.format === "png" ? "image/png" : "image/jpeg",
          config.format === "png" ? undefined : config.quality,
        )
      })

      frames.push(frameBlob)
    }
  }

  return frames
}

/**
 * Renderiza uma transição com efeito de fade entre duas imagens
 */
function renderFadeTransition(
  ctx: CanvasRenderingContext2D,
  fromImage: HTMLImageElement,
  toImage: HTMLImageElement,
  progress: number,
  product: any,
  description: string,
  config: CardConfig,
) {
  // Limpar o canvas
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  // Renderizar a primeira imagem com opacidade decrescente
  ctx.globalAlpha = 1 - progress
  renderCardContent(ctx, fromImage, product, description, config)

  // Renderizar a segunda imagem com opacidade crescente
  ctx.globalAlpha = progress
  renderCardContent(ctx, toImage, product, description, config)

  // Restaurar opacidade
  ctx.globalAlpha = 1
}

/**
 * Renderiza uma transição com efeito de slide entre duas imagens
 */
function renderSlideTransition(
  ctx: CanvasRenderingContext2D,
  fromImage: HTMLImageElement,
  toImage: HTMLImageElement,
  progress: number,
  product: any,
  description: string,
  config: CardConfig,
) {
  // Limpar o canvas
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  // Calcular posições para o efeito de slide
  const slideOffset = ctx.canvas.width * progress

  // Salvar estado do contexto
  ctx.save()

  // Aplicar clipping para a área da imagem
  ctx.beginPath()
  ctx.rect(0, 0, ctx.canvas.width, ctx.canvas.height * 0.5) // Área da imagem
  ctx.clip()

  // Renderizar a primeira imagem deslizando para fora
  ctx.save()
  ctx.translate(-slideOffset, 0)
  renderCardContent(ctx, fromImage, product, description, config)
  ctx.restore()

  // Renderizar a segunda imagem deslizando para dentro
  ctx.save()
  ctx.translate(ctx.canvas.width - slideOffset, 0)
  renderCardContent(ctx, toImage, product, description, config)
  ctx.restore()

  // Restaurar o contexto
  ctx.restore()

  // Renderizar conteúdo fixo (texto, preços, etc.)
  renderFixedContent(ctx, product, description, config)
}

/**
 * Renderiza uma transição com efeito de zoom entre duas imagens
 */
function renderZoomTransition(
  ctx: CanvasRenderingContext2D,
  fromImage: HTMLImageElement,
  toImage: HTMLImageElement,
  progress: number,
  product: any,
  description: string,
  config: CardConfig,
) {
  // Limpar o canvas
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  // A primeira imagem diminui
  ctx.globalAlpha = 1 - progress
  ctx.save()
  const scale1 = 1 + progress * 0.2
  ctx.translate(ctx.canvas.width / 2, ctx.canvas.height * 0.25)
  ctx.scale(scale1, scale1)
  ctx.translate(-ctx.canvas.width / 2, -ctx.canvas.height * 0.25)
  renderCardContent(ctx, fromImage, product, description, config)
  ctx.restore()

  // A segunda imagem aumenta
  ctx.globalAlpha = progress
  ctx.save()
  const scale2 = 0.8 + progress * 0.2
  ctx.translate(ctx.canvas.width / 2, ctx.canvas.height * 0.25)
  ctx.scale(scale2, scale2)
  ctx.translate(-ctx.canvas.width / 2, -ctx.canvas.height * 0.25)
  renderCardContent(ctx, toImage, product, description, config)
  ctx.restore()

  // Restaurar opacidade
  ctx.globalAlpha = 1

  // Renderizar conteúdo fixo (texto, preços, etc.)
  renderFixedContent(ctx, product, description, config)
}

/**
 * Renderiza o conteúdo completo do card
 */
function renderCardContent(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  product: any,
  description: string,
  config: CardConfig,
) {
  // Implementação simplificada do renderizador de cards
  // Utilizar a implementação existente do canvas-card-generator.ts
  // ...

  // Limpar o canvas
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  // Desenhar o fundo
  ctx.fillStyle = "#0A0A0F"
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  // Calcular posição e tamanho da imagem
  const imageHeight = ctx.canvas.height * 0.5
  const imgRatio = image.width / image.height
  let imgWidth = ctx.canvas.width
  let imgHeight = imgWidth / imgRatio
  let imgY = 0

  // Ajustar proporções
  if (imgHeight > imageHeight) {
    imgHeight = imageHeight
    imgWidth = imageHeight * imgRatio
    imgY = 0
  } else {
    imgY = (imageHeight - imgHeight) / 2
  }

  // Centralizar horizontalmente
  const imgX = (ctx.canvas.width - imgWidth) / 2

  // Desenhar a imagem
  ctx.drawImage(image, imgX, imgY, imgWidth, imgHeight)

  // Renderizar o resto do conteúdo do card
  renderFixedContent(ctx, product, description, config)
}

/**
 * Renderiza o conteúdo fixo do card (textos, preços, etc.)
 */
function renderFixedContent(ctx: CanvasRenderingContext2D, product: any, description: string, config: CardConfig) {
  // Altura disponível para a imagem
  const imageHeight = ctx.canvas.height * 0.5
  const contentY = imageHeight + 20

  // Fontes
  const titleFont = "bold 32px 'Segoe UI', Arial, sans-serif"
  const priceFont = "bold 48px 'Segoe UI', Arial, sans-serif"
  const descFont = "24px 'Segoe UI', Arial, sans-serif"

  // Cores
  const primaryColor = "#FF4D4F"
  const textColor = "#FFFFFF"
  const secondaryTextColor = "#CCCCCC"

  // Título do produto
  ctx.fillStyle = textColor
  ctx.font = titleFont
  const title = product.productName || "Produto"
  wrapText(ctx, title, 40, contentY, ctx.canvas.width - 80, 40)

  // Preço
  ctx.fillStyle = primaryColor
  ctx.font = priceFont
  const price = `R$ ${product.price || "0,00"}`
  ctx.fillText(price, 40, contentY + 80)

  // Avaliação e vendas
  ctx.fillStyle = secondaryTextColor
  ctx.font = descFont
  const rating = product.ratingStar ? `⭐ ${product.ratingStar}` : ""
  const sales = product.sales ? `${product.sales} vendas` : ""
  const ratingText = [rating, sales].filter(Boolean).join(" • ")
  if (ratingText) {
    ctx.fillText(ratingText, 40, contentY + 120)
  }

  // Descrição
  ctx.fillStyle = textColor
  const descY = contentY + 160
  wrapText(ctx, description, 40, descY, ctx.canvas.width - 80, 30)

  // Botão de call to action
  drawButton(ctx, "COMPRE AGORA", ctx.canvas.width / 2, ctx.canvas.height - 80, ctx.canvas.width - 80, 60, primaryColor)
}

/**
 * Desenha texto com quebra de linha
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(" ")
  let line = ""
  let testLine = ""
  let lineY = y

  for (let n = 0; n < words.length; n++) {
    testLine = line + words[n] + " "
    const metrics = ctx.measureText(testLine)
    const testWidth = metrics.width

    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, lineY)
      line = words[n] + " "
      lineY += lineHeight
    } else {
      line = testLine
    }
  }

  ctx.fillText(line, x, lineY)
}

/**
 * Desenha um botão
 */
function drawButton(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
) {
  // Desenhar o retângulo do botão
  ctx.fillStyle = color
  roundRect(ctx, x - width / 2, y - height / 2, width, height, 10)
  ctx.fill()

  // Texto do botão
  ctx.fillStyle = "#FFFFFF"
  ctx.font = "bold 24px 'Segoe UI', Arial, sans-serif"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(text, x, y)

  // Resetar alinhamento
  ctx.textAlign = "left"
  ctx.textBaseline = "alphabetic"
}

/**
 * Desenha um retângulo com cantos arredondados
 */
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

/**
 * Converte os frames em um GIF animado
 * @param frames Array de frames (Blobs)
 * @param fps Frames por segundo
 * @returns Promise com o Blob do GIF
 */
export async function convertFramesToGif(frames: Blob[], fps = 10): Promise<Blob> {
  // Para implementação real, usaria uma biblioteca como gif.js
  // Esta é uma implementação simplificada para demonstração

  // Simular a criação de um GIF
  // Em uma implementação real, retornaria o GIF criado
  return frames[0]
}

/**
 * Converte os frames em um vídeo MP4
 * @param frames Array de frames (Blobs)
 * @param fps Frames por segundo
 * @returns Promise com o Blob do vídeo
 */
export async function convertFramesToMP4(frames: Blob[], fps = 30): Promise<Blob> {
  // Para implementação real, usaria uma biblioteca como FFmpeg.wasm
  // Esta é uma implementação simplificada para demonstração

  // Simular a criação de um vídeo
  // Em uma implementação real, retornaria o vídeo criado
  return frames[0]
}
