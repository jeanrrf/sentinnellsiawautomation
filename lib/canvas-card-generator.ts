/**
 * Módulo para geração de cards usando a API Canvas
 * Design moderno e otimizado para conversão
 */

import { createCanvas, loadImage } from "./dynamic-imports"

// Tipos para configuração do card
export interface CardConfig {
  width: number
  height: number
  format: "png" | "jpeg"
  quality?: number // 0-1 para JPEG
  template: "modern" | "minimal" | "bold" | "elegant" | "vibrant"
  showBadges: boolean
  showRating: boolean
  showShopName: boolean
  useGradient?: boolean
  customColors?: {
    primary?: string
    secondary?: string
    accent?: string
    background?: string
  }
}

// Configuração padrão
export const DEFAULT_CARD_CONFIG: CardConfig = {
  width: 1080,
  height: 1920,
  format: "png",
  quality: 0.9,
  template: "modern",
  showBadges: true,
  showRating: true,
  showShopName: false,
  useGradient: true,
}

// Paletas de cores modernas para diferentes templates
const COLOR_PALETTES = {
  modern: {
    background: "#0A0A0F",
    backgroundGradient: ["#0A0A0F", "#1A1A25"],
    primary: "#FF4D4F",
    secondary: "#FFFFFF",
    accent: "#FFD700",
    text: "#FFFFFF",
    textSecondary: "#CCCCCC",
    descriptionBg: "rgba(255,255,255,0.08)",
    badgeBg: "#FF4D4F",
    freeBadgeBg: "#00C853",
  },
  minimal: {
    background: "#FFFFFF",
    backgroundGradient: ["#FFFFFF", "#F5F5F7"],
    primary: "#000000",
    secondary: "#333333",
    accent: "#0066FF",
    text: "#000000",
    textSecondary: "#666666",
    descriptionBg: "rgba(0,0,0,0.04)",
    badgeBg: "#FF3B30",
    freeBadgeBg: "#34C759",
  },
  bold: {
    background: "#0D0D2B",
    backgroundGradient: ["#0D0D2B", "#1A1A45"],
    primary: "#FF6B6B",
    secondary: "#FFFFFF",
    accent: "#4FFFB0",
    text: "#FFFFFF",
    textSecondary: "#A0A0A0",
    descriptionBg: "rgba(255,255,255,0.1)",
    badgeBg: "#FF6B6B",
    freeBadgeBg: "#4FFFB0",
  },
  elegant: {
    background: "#1C1C1E",
    backgroundGradient: ["#1C1C1E", "#2C2C2E"],
    primary: "#E5B80B",
    secondary: "#FFFFFF",
    accent: "#D4AF37",
    text: "#FFFFFF",
    textSecondary: "#CCCCCC",
    descriptionBg: "rgba(255,255,255,0.07)",
    badgeBg: "#E5B80B",
    freeBadgeBg: "#00BFA5",
  },
  vibrant: {
    background: "#6200EA",
    backgroundGradient: ["#6200EA", "#3700B3"],
    primary: "#FF4081",
    secondary: "#FFFFFF",
    accent: "#00E5FF",
    text: "#FFFFFF",
    textSecondary: "#E0E0E0",
    descriptionBg: "rgba(255,255,255,0.12)",
    badgeBg: "#FF4081",
    freeBadgeBg: "#00E5FF",
  },
}

// Fontes modernas para diferentes elementos
const FONTS = {
  title: "bold 48px 'Segoe UI', Arial, sans-serif",
  price: "bold 72px 'Segoe UI', Arial, sans-serif",
  originalPrice: "36px 'Segoe UI', Arial, sans-serif",
  badge: "bold 32px 'Segoe UI', Arial, sans-serif",
  info: "36px 'Segoe UI', Arial, sans-serif",
  button: "bold 40px 'Segoe UI', Arial, sans-serif",
  description: "36px 'Segoe UI', Arial, sans-serif",
  descriptionHighlight: "bold 36px 'Segoe UI', Arial, sans-serif",
}

/**
 * Gera um card de produto usando Canvas API
 * @param product Dados do produto
 * @param description Descrição gerada pela API Gemini
 * @param config Configuração do card
 * @returns Promise com o Blob da imagem gerada
 */
export async function generateProductCard(
  product: any,
  description: string,
  config: Partial<CardConfig> = {},
): Promise<Blob> {
  // Mesclar configuração padrão com a fornecida
  const finalConfig: CardConfig = { ...DEFAULT_CARD_CONFIG, ...config }

  return new Promise((resolve, reject) => {
    try {
      // Criar canvas com as dimensões especificadas
      const canvas = createCanvas(finalConfig.width, finalConfig.height)
      const ctx = canvas.getContext("2d")

      if (!ctx) {
        throw new Error("Failed to get canvas context")
      }

      // Obter paleta de cores com base no template
      const palette = COLOR_PALETTES[finalConfig.template]

      // Aplicar cores personalizadas se fornecidas
      if (finalConfig.customColors) {
        if (finalConfig.customColors.primary) palette.primary = finalConfig.customColors.primary
        if (finalConfig.customColors.secondary) palette.secondary = finalConfig.customColors.secondary
        if (finalConfig.customColors.accent) palette.accent = finalConfig.customColors.accent
        if (finalConfig.customColors.background) palette.background = finalConfig.customColors.background
      }

      // Renderizar o fundo
      if (finalConfig.useGradient && palette.backgroundGradient) {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
        gradient.addColorStop(0, palette.backgroundGradient[0])
        gradient.addColorStop(1, palette.backgroundGradient[1])
        ctx.fillStyle = gradient
      } else {
        ctx.fillStyle = palette.background
      }
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Carregar as imagens do produto
      loadImage(product.imageUrl || "/placeholder.svg")
        .then((mainImage) => {
          // Renderizar o card com a imagem carregada
          renderCardWithImage(ctx, mainImage, product, description, finalConfig, palette)

          // Converter canvas para blob
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob)
              } else {
                reject(new Error("Failed to convert canvas to blob"))
              }
            },
            finalConfig.format === "png" ? "image/png" : "image/jpeg",
            finalConfig.format === "png" ? undefined : finalConfig.quality,
          )
        })
        .catch(() => {
          reject(new Error("Failed to load product image"))
        })
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Renderiza o card com a imagem carregada
 */
function renderCardWithImage(
  ctx: CanvasRenderingContext2D,
  img: any,
  product: any,
  description: string,
  config: CardConfig,
  palette: any,
) {
  const { width, height } = ctx.canvas

  // Calcular dimensões e posições
  const imageHeight = height * 0.55 // 55% da altura para a imagem
  const contentTop = imageHeight + 40 // Início do conteúdo após a imagem

  // Renderizar a imagem principal com efeito de sombra
  renderProductImage(ctx, img, 0, 0, width, imageHeight, palette)

  // Adicionar overlay gradiente na parte inferior da imagem
  addGradientOverlay(ctx, 0, imageHeight - 200, width, 200, palette.background)

  // Renderizar badges se configurado
  if (config.showBadges) {
    renderBadges(ctx, product, palette, width)
  }

  // Renderizar informações do produto
  let yPosition = contentTop

  // Nome do produto com sombra de texto para melhor legibilidade
  ctx.shadowColor = "rgba(0,0,0,0.5)"
  ctx.shadowBlur = 10
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 2
  ctx.fillStyle = palette.text
  ctx.font = FONTS.title
  yPosition = renderWrappedText(ctx, product.productName, 40, yPosition, width - 80, 58)

  // Resetar sombra
  ctx.shadowColor = "transparent"
  ctx.shadowBlur = 0
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0

  // Espaço após o título
  yPosition += 40

  // Preço e desconto com design moderno
  yPosition = renderPriceSection(ctx, product, 40, yPosition, palette)

  // Espaço após o preço
  yPosition += 30

  // Avaliação e vendas com ícones
  if (config.showRating) {
    renderRatingAndSales(ctx, product, 40, yPosition, palette)
    yPosition += 70
  }

  // Adicionar informações de frete (se disponível)
  if (product.freeShipping) {
    ctx.fillStyle = palette.accent
    ctx.font = FONTS.info
    ctx.fillText("✅ FRETE GRÁTIS", 40, yPosition)
    yPosition += 60
  } else if (product.shippingInfo) {
    ctx.fillStyle = palette.textSecondary
    ctx.font = FONTS.info
    ctx.fillText(`🚚 ${product.shippingInfo}`, 40, yPosition)
    yPosition += 60
  }

  // Renderizar uma descrição formatada e estilizada
  const descriptionSpace = height - yPosition - 140 // 140px para o botão e espaço
  yPosition = renderStylizedDescription(ctx, description, 40, yPosition, width - 80, descriptionSpace, palette)

  // Renderizar botão de call-to-action moderno
  renderModernCallToAction(ctx, height - 120, width, palette)

  // Adicionar marca d'água ou logo com estilo moderno
  renderWatermark(ctx, width - 200, height - 60, palette)
}

/**
 * Renderiza a imagem do produto com tratamento para diferentes proporções
 * e efeitos visuais modernos
 */
function renderProductImage(
  ctx: CanvasRenderingContext2D,
  img: any,
  x: number,
  y: number,
  width: number,
  height: number,
  palette: any,
) {
  // Calcular dimensões para manter a proporção
  const imgRatio = img.width / img.height
  let imgWidth = width
  let imgHeight = width / imgRatio
  let imgY = y

  // Se a imagem for mais alta que o espaço disponível
  if (imgHeight > height) {
    imgHeight = height
    imgWidth = height * imgRatio
    x = (width - imgWidth) / 2
  } else {
    // Centralizar verticalmente
    imgY = y + (height - imgHeight) / 2
  }

  // Adicionar sombra sutil para dar profundidade
  ctx.shadowColor = "rgba(0,0,0,0.3)"
  ctx.shadowBlur = 20
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 10

  // Desenhar a imagem
  ctx.drawImage(img, x, imgY, imgWidth, imgHeight)

  // Resetar sombra
  ctx.shadowColor = "transparent"
  ctx.shadowBlur = 0
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0

  // Adicionar efeito de vinheta nas bordas
  addVignetteEffect(ctx, x, y, width, height)
}

/**
 * Adiciona um efeito de vinheta nas bordas da imagem
 */
function addVignetteEffect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
  const gradient = ctx.createRadialGradient(
    x + width / 2,
    y + height / 2,
    height * 0.3,
    x + width / 2,
    y + height / 2,
    height * 0.8,
  )

  gradient.addColorStop(0, "rgba(0,0,0,0)")
  gradient.addColorStop(1, "rgba(0,0,0,0.6)")

  ctx.fillStyle = gradient
  ctx.fillRect(x, y, width, height)
}

/**
 * Adiciona um overlay gradiente
 */
function addGradientOverlay(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  endColor: string,
) {
  const gradient = ctx.createLinearGradient(0, y, 0, y + height)
  gradient.addColorStop(0, "rgba(0,0,0,0)")
  gradient.addColorStop(1, endColor)

  ctx.fillStyle = gradient
  ctx.fillRect(x, y, width, height)
}

/**
 * Renderiza badges (desconto, frete grátis, etc) com design moderno
 */
function renderBadges(ctx: CanvasRenderingContext2D, product: any, palette: any, canvasWidth: number) {
  // Badge de desconto
  const discountRate = Number.parseFloat(product.priceDiscountRate || "0") / 100
  if (discountRate > 0) {
    const discountText = `-${Math.round(discountRate * 100)}%`
    ctx.font = FONTS.badge
    const textWidth = ctx.measureText(discountText).width
    const badgeWidth = textWidth + 40
    const badgeHeight = 60
    const badgeX = canvasWidth - badgeWidth - 40
    const badgeY = 40

    // Adicionar sombra para o badge
    ctx.shadowColor = "rgba(0,0,0,0.3)"
    ctx.shadowBlur = 10
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 4

    // Desenhar o badge com cantos arredondados
    ctx.fillStyle = palette.badgeBg
    roundRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 30)
    ctx.fill()

    // Resetar sombra
    ctx.shadowColor = "transparent"
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0

    // Texto do desconto
    ctx.fillStyle = "#FFFFFF"
    ctx.fillText(discountText, badgeX + 20, badgeY + 42)
  }

  // Badge de frete grátis (se aplicável)
  if (product.freeShipping) {
    const shippingText = "FRETE GRÁTIS"
    ctx.font = FONTS.badge
    const textWidth = ctx.measureText(shippingText).width
    const badgeWidth = textWidth + 40
    const badgeHeight = 60
    const badgeX = 40
    const badgeY = 40

    // Adicionar sombra para o badge
    ctx.shadowColor = "rgba(0,0,0,0.3)"
    ctx.shadowBlur = 10
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 4

    // Desenhar o badge com cantos arredondados
    ctx.fillStyle = palette.freeBadgeBg
    roundRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 30)
    ctx.fill()

    // Resetar sombra
    ctx.shadowColor = "transparent"
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0

    // Texto do frete
    ctx.fillStyle = "#FFFFFF"
    ctx.fillText(shippingText, badgeX + 20, badgeY + 42)
  }
}

/**
 * Renderiza a seção de preço com design moderno
 */
function renderPriceSection(ctx: CanvasRenderingContext2D, product: any, x: number, y: number, palette: any): number {
  // Preço atual com efeito de destaque
  ctx.fillStyle = palette.primary
  ctx.font = FONTS.price
  const priceText = `R$ ${product.price}`

  // Adicionar sombra sutil para o preço
  ctx.shadowColor = "rgba(0,0,0,0.3)"
  ctx.shadowBlur = 5
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 2

  ctx.fillText(priceText, x, y)

  // Resetar sombra
  ctx.shadowColor = "transparent"
  ctx.shadowBlur = 0
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0

  // Preço original (se houver desconto)
  const discountRate = Number.parseFloat(product.priceDiscountRate || "0") / 100
  if (discountRate > 0) {
    const originalPrice = (Number.parseFloat(product.price) / (1 - discountRate)).toFixed(2)
    ctx.fillStyle = palette.textSecondary
    ctx.font = FONTS.originalPrice

    // Posicionar o preço original ABAIXO do preço atual com design moderno
    const originalPriceText = `De R$ ${originalPrice}`
    ctx.fillText(originalPriceText, x, y + 50)

    // Linha cortando o preço original com estilo moderno
    const originalPriceWidth = ctx.measureText(originalPriceText).width

    ctx.strokeStyle = palette.textSecondary
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(x, y + 35)
    ctx.lineTo(x + originalPriceWidth, y + 35)
    ctx.stroke()
  }

  // Retornar a próxima posição Y, considerando se temos preço original ou não
  return discountRate > 0 ? y + 90 : y + 70
}

/**
 * Renderiza avaliação e vendas com ícones
 */
function renderRatingAndSales(ctx: CanvasRenderingContext2D, product: any, x: number, y: number, palette: any) {
  ctx.fillStyle = palette.textSecondary
  ctx.font = FONTS.info

  // Estrela com cor destacada
  ctx.fillStyle = "#FFD700" // Cor dourada para a estrela
  ctx.fillText("⭐", x, y)

  // Avaliação e vendas
  ctx.fillStyle = palette.textSecondary
  const ratingText = `${product.ratingStar || "4.5"} • ${Number.parseInt(product.sales || "0").toLocaleString("pt-BR")} vendas`
  ctx.fillText(ratingText, x + 40, y)
}

/**
 * Renderiza uma descrição estilizada e formatada
 */
function renderStylizedDescription(
  ctx: CanvasRenderingContext2D,
  description: string,
  x: number,
  y: number,
  maxWidth: number,
  maxHeight: number,
  palette: any,
): number {
  // Desenhar fundo para a descrição com design moderno
  const padding = 30
  const cornerRadius = 20

  // Fundo com gradiente sutil
  const descBgGradient = ctx.createLinearGradient(
    x - padding,
    y - padding,
    x - padding,
    y - padding + maxHeight + padding * 2,
  )
  descBgGradient.addColorStop(0, palette.descriptionBg)
  descBgGradient.addColorStop(1, adjustAlpha(palette.descriptionBg, 0.7))

  ctx.fillStyle = descBgGradient

  // Adicionar sombra sutil para o container
  ctx.shadowColor = "rgba(0,0,0,0.2)"
  ctx.shadowBlur = 15
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 5

  roundRect(ctx, x - padding, y - padding, maxWidth + padding * 2, maxHeight + padding * 2, cornerRadius)
  ctx.fill()

  // Resetar sombra
  ctx.shadowColor = "transparent"
  ctx.shadowBlur = 0
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0

  // Formatar e estilizar a descrição
  const formattedDescription = formatDescription(description)

  // Renderizar o texto da descrição com formatação melhorada
  ctx.fillStyle = palette.text
  ctx.font = FONTS.description

  let currentY = y + 10

  // Dividir em parágrafos para melhor formatação
  const paragraphs = formattedDescription.split("\n")

  for (const paragraph of paragraphs) {
    if (paragraph.trim() === "") {
      currentY += 20 // Espaço entre parágrafos
      continue
    }

    // Verificar se é um destaque (começa com emoji ou tem palavras-chave)
    const isHighlight = /^[^\w\s]|OFERTA|PROMOÇÃO|DESCONTO|GRÁTIS|FRETE/i.test(paragraph)

    if (isHighlight) {
      ctx.font = FONTS.descriptionHighlight
      ctx.fillStyle = palette.accent
    } else {
      ctx.font = FONTS.description
      ctx.fillStyle = palette.text
    }

    currentY = renderWrappedText(ctx, paragraph, x, currentY, maxWidth, 42)
    currentY += 10 // Espaço adicional após cada parágrafo
  }

  return currentY
}

/**
 * Formata a descrição para melhor apresentação
 */
function formatDescription(description: string): string {
  // Substituir múltiplas quebras de linha por uma única
  let formatted = description.replace(/\n{3,}/g, "\n\n")

  // Destacar emojis e hashtags
  formatted = formatted.replace(/(#\w+)/g, "$1 ")

  // Garantir que frases com emojis importantes estejam em linhas separadas
  formatted = formatted.replace(/([^\n])([🔥💰⭐✅🚚💯🎁])/gu, "$1\n$2")

  return formatted
}

/**
 * Renderiza botão de call-to-action com design moderno
 */
function renderModernCallToAction(ctx: CanvasRenderingContext2D, y: number, width: number, palette: any) {
  const buttonWidth = width - 80
  const buttonHeight = 80
  const buttonX = 40
  const buttonY = y

  // Gradiente para o botão
  const buttonGradient = ctx.createLinearGradient(buttonX, buttonY, buttonX + buttonWidth, buttonY)
  buttonGradient.addColorStop(0, palette.primary)
  buttonGradient.addColorStop(1, adjustColor(palette.primary, 20))

  // Adicionar sombra para o botão
  ctx.shadowColor = "rgba(0,0,0,0.3)"
  ctx.shadowBlur = 15
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 8

  // Desenhar o botão
  ctx.fillStyle = buttonGradient
  roundRect(ctx, buttonX, buttonY, buttonWidth, buttonHeight, 16)
  ctx.fill()

  // Resetar sombra
  ctx.shadowColor = "transparent"
  ctx.shadowBlur = 0
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0

  // Texto do botão com efeito de brilho
  ctx.fillStyle = "#FFFFFF"
  ctx.font = FONTS.button
  ctx.textAlign = "center"

  // Adicionar sombra sutil ao texto
  ctx.shadowColor = "rgba(0,0,0,0.5)"
  ctx.shadowBlur = 4
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 2

  ctx.fillText("COMPRE AGORA • LINK NA BIO", width / 2, y + 50)

  // Resetar sombra e alinhamento
  ctx.shadowColor = "transparent"
  ctx.shadowBlur = 0
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0
  ctx.textAlign = "left"
}

/**
 * Renderiza uma marca d'água ou logo com estilo moderno
 */
function renderWatermark(ctx: CanvasRenderingContext2D, x: number, y: number, palette: any) {
  ctx.fillStyle = palette.textSecondary + "80" // 50% de opacidade
  ctx.font = "24px 'Segoe UI', Arial, sans-serif"
  ctx.fillText("Gerado por ShopeeCards", x, y)
}

/**
 * Renderiza texto com quebra de linha
 * @returns A próxima posição Y após o texto
 */
function renderWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const words = text.split(" ")
  let line = ""
  let testLine = ""
  let currentY = y

  for (let i = 0; i < words.length; i++) {
    testLine = line + words[i] + " "
    const metrics = ctx.measureText(testLine)
    const testWidth = metrics.width

    if (testWidth > maxWidth && i > 0) {
      ctx.fillText(line, x, currentY)
      line = words[i] + " "
      currentY += lineHeight
    } else {
      line = testLine
    }
  }

  ctx.fillText(line, x, currentY)
  return currentY + lineHeight
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
 * Ajusta a cor para criar variações (mais clara ou mais escura)
 */
function adjustColor(color: string, amount: number): string {
  // Converter hex para RGB
  let r = Number.parseInt(color.substring(1, 3), 16)
  let g = Number.parseInt(color.substring(3, 5), 16)
  let b = Number.parseInt(color.substring(5, 7), 16)

  // Ajustar valores
  r = Math.max(0, Math.min(255, r + amount))
  g = Math.max(0, Math.min(255, g + amount))
  b = Math.max(0, Math.min(255, b + amount))

  // Converter de volta para hex
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
}

/**
 * Ajusta a transparência de uma cor
 */
function adjustAlpha(color: string, alpha: number): string {
  if (color.startsWith("rgba")) {
    // Já é rgba, substituir o valor alpha
    return color.replace(/rgba$$(.+?),\s*[\d.]+$$/, `rgba($1, ${alpha})`)
  } else if (color.startsWith("rgb")) {
    // Converter rgb para rgba
    return color.replace(/rgb$$(.+?)$$/, `rgba($1, ${alpha})`)
  } else if (color.startsWith("#")) {
    // Converter hex para rgba
    const r = Number.parseInt(color.substring(1, 3), 16)
    const g = Number.parseInt(color.substring(3, 5), 16)
    const b = Number.parseInt(color.substring(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  // Fallback
  return color
}

/**
 * Gera uma segunda variação do card com layout alternativo
 */
export async function generateAlternativeCard(
  product: any,
  description: string,
  config: Partial<CardConfig> = {},
): Promise<Blob> {
  // Implementar uma variação alternativa do card
  // Esta função pode ser expandida para criar diferentes estilos de cards
  const alternativeConfig: CardConfig = {
    ...DEFAULT_CARD_CONFIG,
    ...config,
    template: config.template || "elegant", // Usar template diferente por padrão
  }

  return generateProductCard(product, description, alternativeConfig)
}
