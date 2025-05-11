import { createCanvas, loadImage, registerFont } from "canvas"
import path from "path"
import fs from "fs"
import { logger } from "./logger"

// Interface para o produto
interface Product {
  itemId: string
  productName: string
  price: string | number
  originalPrice?: string | number
  priceDiscountRate?: string | number
  imageUrl: string
  sales: string | number
  ratingStar?: string | number
  shopName?: string
  offerLink?: string
  freeShipping?: boolean
  shippingInfo?: string
}

// Opções de estilo para o card
interface CardStyleOptions {
  width: number
  height: number
  showDiscount: boolean
  showRating: boolean
  showShipping: boolean
  darkMode: boolean
  template: "search" | "modern" | "minimal" | "elegant" | "bold" | "vibrant"
}

// Opções padrão
const defaultOptions: CardStyleOptions = {
  width: 800,
  height: 1000,
  showDiscount: true,
  showRating: true,
  showShipping: true,
  darkMode: false,
  template: "search",
}

// Registrar fontes
const registerFonts = () => {
  try {
    const fontPath = path.join(process.cwd(), "public", "fonts")

    // Verificar se as fontes existem
    if (fs.existsSync(path.join(fontPath, "Montserrat-Bold.ttf"))) {
      registerFont(path.join(fontPath, "Montserrat-Bold.ttf"), { family: "Montserrat", weight: "bold" })
      registerFont(path.join(fontPath, "Montserrat-Regular.ttf"), { family: "Montserrat", weight: "normal" })
      registerFont(path.join(fontPath, "Montserrat-Medium.ttf"), { family: "Montserrat", weight: "500" })
    } else {
      // Fallback para fontes do sistema
      logger.warn("Custom fonts not found, using system fonts")
    }
  } catch (error) {
    logger.error("Error registering fonts:", error)
  }
}

// Função para desenhar retângulo com cantos arredondados
const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill = true,
  stroke = false,
) => {
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
  if (fill) {
    ctx.fill()
  }
  if (stroke) {
    ctx.stroke()
  }
}

// Função para quebrar texto em múltiplas linhas
const wrapText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 0,
): number => {
  const words = text.split(" ")
  let line = ""
  let lines = 0
  let currentY = y

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " "
    const metrics = ctx.measureText(testLine)
    const testWidth = metrics.width

    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, currentY)
      line = words[n] + " "
      currentY += lineHeight
      lines++

      if (maxLines > 0 && lines >= maxLines) {
        if (n < words.length - 1) {
          // Adicionar reticências se houver mais palavras
          line = line.trim() + "..."
          ctx.fillText(line, x, currentY)
        } else {
          ctx.fillText(line, x, currentY)
        }
        return currentY
      }
    } else {
      line = testLine
    }
  }

  ctx.fillText(line, x, currentY)
  return currentY + lineHeight
}

// Função para formatar preço
const formatPrice = (price: string | number): string => {
  const numPrice = typeof price === "string" ? Number.parseFloat(price) : price
  return `R$ ${numPrice.toFixed(2).replace(".", ",")}`
}

// Função principal para gerar card no estilo da aba Busca
export const generateSearchStyleCard = async (
  product: Product,
  description: string,
  options: Partial<CardStyleOptions> = {},
): Promise<Buffer> => {
  // Registrar fontes
  registerFonts()

  // Mesclar opções padrão com as fornecidas
  const finalOptions: CardStyleOptions = { ...defaultOptions, ...options }

  // Dimensões do canvas
  const width = finalOptions.width
  const height = finalOptions.height

  // Criar canvas
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext("2d")

  // Definir cores com base no modo (claro/escuro)
  const colors = finalOptions.darkMode
    ? {
        background: "#121212",
        cardBg: "#1E1E1E",
        text: "#FFFFFF",
        textSecondary: "#AAAAAA",
        accent: "#FF4D4D",
        border: "#333333",
        rating: "#FFD700",
        shipping: "#4CAF50",
      }
    : {
        background: "#F5F5F7",
        cardBg: "#FFFFFF",
        text: "#000000",
        textSecondary: "#666666",
        accent: "#FF4D4D",
        border: "#E0E0E0",
        rating: "#FFD700",
        shipping: "#4CAF50",
      }

  // Desenhar fundo
  ctx.fillStyle = colors.background
  ctx.fillRect(0, 0, width, height)

  try {
    // Carregar imagem do produto
    const image = await loadImage(product.imageUrl)

    // Desenhar card principal
    ctx.fillStyle = colors.cardBg
    if (finalOptions.template === "search") {
      // Estilo da aba Busca (card retangular com sombra)
      ctx.shadowColor = "rgba(0, 0, 0, 0.1)"
      ctx.shadowBlur = 10
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 5
      drawRoundedRect(ctx, 40, 40, width - 80, height - 80, 12)
      ctx.shadowColor = "transparent"
    } else {
      // Outros estilos
      drawRoundedRect(ctx, 40, 40, width - 80, height - 80, 12)
    }

    // Área da imagem (50% da altura do card)
    const imageAreaHeight = (height - 80) * 0.5
    const imageContainerX = 60
    const imageContainerY = 60
    const imageContainerWidth = width - 120
    const imageContainerHeight = imageAreaHeight - 40

    // Desenhar container da imagem
    ctx.fillStyle = finalOptions.darkMode ? "#2A2A2A" : "#F8F8F8"
    drawRoundedRect(ctx, imageContainerX, imageContainerY, imageContainerWidth, imageContainerHeight, 8)

    // Calcular dimensões da imagem mantendo proporção
    const imageAspect = image.width / image.height
    let drawWidth = imageContainerWidth - 40
    let drawHeight = drawWidth / imageAspect

    if (drawHeight > imageContainerHeight - 40) {
      drawHeight = imageContainerHeight - 40
      drawWidth = drawHeight * imageAspect
    }

    // Centralizar imagem
    const imageX = imageContainerX + (imageContainerWidth - drawWidth) / 2
    const imageY = imageContainerY + (imageContainerHeight - drawHeight) / 2

    // Desenhar imagem
    ctx.drawImage(image, imageX, imageY, drawWidth, drawHeight)

    // Área de informações do produto
    const infoStartY = imageContainerY + imageContainerHeight + 30

    // Nome do produto
    ctx.font = "bold 32px Montserrat"
    ctx.fillStyle = colors.text
    const titleMaxWidth = width - 120
    const titleY = wrapText(ctx, product.productName, 60, infoStartY, titleMaxWidth, 40, 2)

    // Preço
    const priceY = titleY + 40
    ctx.font = "bold 48px Montserrat"
    ctx.fillStyle = colors.accent
    ctx.fillText(formatPrice(product.price), 60, priceY)

    // Preço original (se houver desconto)
    let currentY = priceY + 20
    if (
      finalOptions.showDiscount &&
      product.priceDiscountRate &&
      Number.parseFloat(String(product.priceDiscountRate)) > 0
    ) {
      const discountRate = Number.parseFloat(String(product.priceDiscountRate)) / 100
      const originalPrice =
        typeof product.price === "string"
          ? Number.parseFloat(product.price) / (1 - discountRate)
          : product.price / (1 - discountRate)

      ctx.font = "24px Montserrat"
      ctx.fillStyle = colors.textSecondary
      const originalPriceText = `De: ${formatPrice(originalPrice)}`
      ctx.fillText(originalPriceText, 60, priceY + 40)

      // Linha cortando o preço original
      const metrics = ctx.measureText(originalPriceText)
      ctx.strokeStyle = colors.textSecondary
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(60, priceY + 35)
      ctx.lineTo(60 + metrics.width, priceY + 35)
      ctx.stroke()

      currentY += 30
    }

    // Avaliação e vendas
    if (finalOptions.showRating) {
      currentY += 20

      // Estrela
      ctx.fillStyle = colors.rating
      ctx.font = "24px Montserrat"
      ctx.fillText("★", 60, currentY)

      // Avaliação
      ctx.fillStyle = colors.text
      const rating = product.ratingStar ? Number.parseFloat(String(product.ratingStar)).toFixed(1) : "4.8"
      const ratingText = `${rating}`
      const ratingWidth = ctx.measureText(ratingText).width
      ctx.fillText(ratingText, 85, currentY)

      // Vendas
      ctx.fillStyle = colors.textSecondary
      const salesText = `• ${typeof product.sales === "number" ? product.sales.toLocaleString() : product.sales} vendas`
      ctx.fillText(salesText, 85 + ratingWidth + 10, currentY)

      currentY += 40
    }

    // Informação de frete
    if (finalOptions.showShipping) {
      if (product.freeShipping) {
        ctx.fillStyle = colors.shipping
        ctx.font = "bold 24px Montserrat"
        ctx.fillText("✓ FRETE GRÁTIS", 60, currentY)
        currentY += 40
      } else if (product.shippingInfo) {
        ctx.fillStyle = colors.textSecondary
        ctx.font = "24px Montserrat"
        ctx.fillText(`🚚 ${product.shippingInfo}`, 60, currentY)
        currentY += 40
      }
    }

    // Descrição
    currentY += 10
    ctx.font = "24px Montserrat"
    ctx.fillStyle = colors.text

    // Container para descrição
    const descContainerX = 60
    const descContainerY = currentY
    const descContainerWidth = width - 120
    const descContainerHeight = height - 80 - descContainerY + 20

    ctx.fillStyle = finalOptions.darkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)"
    drawRoundedRect(ctx, descContainerX, descContainerY, descContainerWidth, descContainerHeight, 8)

    // Texto da descrição
    ctx.fillStyle = colors.text
    wrapText(ctx, description, 80, currentY + 30, descContainerWidth - 40, 30, 8)

    // Adicionar marca d'água
    ctx.font = "16px Montserrat"
    ctx.fillStyle = finalOptions.darkMode ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)"
    ctx.fillText("Gerado por ShopeeCards", width - 200, height - 30)

    // Retornar buffer
    return canvas.toBuffer("image/png")
  } catch (error) {
    logger.error("Error generating search style card:", error)
    throw error
  }
}

// Função para gerar todos os estilos de cards para um produto
export const generateAllCardStyles = async (
  product: Product,
  description: string,
  darkMode = false,
): Promise<Record<string, Buffer>> => {
  const templates = ["search", "modern", "minimal", "elegant", "bold", "vibrant"]
  const results: Record<string, Buffer> = {}

  for (const template of templates) {
    try {
      const buffer = await generateSearchStyleCard(product, description, {
        template: template as any,
        darkMode,
      })
      results[template] = buffer
    } catch (error) {
      logger.error(`Error generating ${template} card:`, error)
    }
  }

  return results
}
