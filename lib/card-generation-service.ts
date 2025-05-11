/**
 * Serviço centralizado para geração de cards
 * Padroniza o processo em todo o sistema
 */
import { createLogger } from "@/lib/logger"
import { generateProductCard, generateAlternativeCard, type CardConfig } from "@/lib/canvas-card-generator"

const logger = createLogger("card-generation-service")

export interface CardGenerationResult {
  success: boolean
  error?: string
  description?: string
  pngUrl?: string
  jpegUrl?: string
  pngUrl2?: string // Segunda variação
  jpegUrl2?: string // Segunda variação
  pngBlob?: Blob
  jpegBlob?: Blob
  pngBlob2?: Blob // Segunda variação
  jpegBlob2?: Blob // Segunda variação
  product?: any
}

export interface CardGenerationOptions {
  useAI?: boolean
  customDescription?: string
  template1?: string
  template2?: string
  includeSecondVariation?: boolean
  useGradient?: boolean
  customColors?: {
    primary?: string
    secondary?: string
    accent?: string
    background?: string
  }
}

/**
 * Detecta a categoria do produto para aplicar temas apropriados
 */
function detectProductCategory(product: any): string {
  const name = product.productName.toLowerCase()

  if (/maquiagem|batom|base|blush|sombra|beauty|beleza|cosm[eé]tic/i.test(name)) {
    return "beauty"
  } else if (/celular|smartphone|iphone|samsung|xiaomi|eletr[ôo]nic|gadget|fone|headset/i.test(name)) {
    return "tech"
  } else if (/roupa|camiseta|blusa|vestido|cal[çc]a|moda|fashion/i.test(name)) {
    return "fashion"
  } else if (/casa|cozinha|decora[çc][ãa]o|m[óo]veis|utens[íi]lio/i.test(name)) {
    return "home"
  } else if (/livro|leitura|literatura/i.test(name)) {
    return "books"
  } else if (/joia|colar|pulseira|anel|brinco|acess[óo]rio/i.test(name)) {
    return "accessories"
  }

  return "general"
}

/**
 * Obtém cores temáticas com base na categoria do produto
 */
function getCategoryColors(category: string): any {
  switch (category) {
    case "beauty":
      return {
        primary: "#FF6B9D",
        accent: "#FFC2D1",
        background: "#2D1832",
      }
    case "tech":
      return {
        primary: "#00B4DB",
        accent: "#00DFFC",
        background: "#0A1929",
      }
    case "fashion":
      return {
        primary: "#9C27B0",
        accent: "#E1BEE7",
        background: "#1A1A2E",
      }
    case "home":
      return {
        primary: "#26A69A",
        accent: "#80CBC4",
        background: "#1D2D50",
      }
    case "books":
      return {
        primary: "#FF7043",
        accent: "#FFAB91",
        background: "#2C3E50",
      }
    case "accessories":
      return {
        primary: "#FFD700",
        accent: "#FFF59D",
        background: "#1F1F1F",
      }
    default:
      return {
        primary: "#FF4D4F",
        accent: "#FFD700",
        background: "#0A0A0F",
      }
  }
}

/**
 * Gera cards para um produto específico
 * @param product Dados do produto
 * @param options Opções de geração
 * @param apiBaseUrl URL base da API (opcional, para uso no servidor)
 * @returns Resultado da geração
 */
export async function generateCardsForProduct(
  product: any,
  options: CardGenerationOptions = {},
  apiBaseUrl?: string,
): Promise<CardGenerationResult> {
  try {
    logger.info("Iniciando geração de cards", { productId: product.itemId, options })

    // Processar informações de frete se disponíveis
    if (product.shipping) {
      // Se temos informações detalhadas de frete
      if (product.shipping.isFree) {
        product.freeShipping = true
      } else if (product.shipping.value) {
        product.shippingInfo = `Frete: R$ ${product.shipping.value.toFixed(2)}`
      }
    } else if (product.freeShipping === undefined) {
      // Tentar inferir com base em outros campos ou padrões comuns
      if (
        product.productName.toLowerCase().includes("frete grátis") ||
        (product.priceDiscountRate && Number.parseInt(product.priceDiscountRate) > 50)
      ) {
        product.freeShipping = true
      } else {
        product.freeShipping = false
      }
    }

    // Configurações padrão e personalizadas
    const {
      useAI = true,
      customDescription = "",
      template1 = "modern",
      template2 = "elegant",
      includeSecondVariation = true,
      useGradient = true,
      customColors = {},
    } = options

    // Detectar categoria do produto e obter cores temáticas
    const productCategory = detectProductCategory(product)
    const categoryColors = getCategoryColors(productCategory)

    // Mesclar cores da categoria com cores personalizadas
    const finalCustomColors = {
      ...categoryColors,
      ...customColors,
    }

    // Gerar descrição
    let description = customDescription
    if (useAI && !description) {
      try {
        logger.info("Gerando descrição com IA")
        const descResponse = await fetch(`${apiBaseUrl || ""}/api/generate-description`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ product }),
        })

        if (!descResponse.ok) {
          throw new Error(`Falha ao gerar descrição: ${descResponse.status}`)
        }

        const descData = await descResponse.json()
        if (!descData.success) {
          throw new Error(descData.error || "Erro desconhecido ao gerar descrição")
        }

        description = descData.description
        logger.info("Descrição gerada com sucesso")
      } catch (descError: any) {
        logger.warn("Falha ao gerar descrição com IA, usando fallback", {
          error: descError.message,
        })

        // Criar descrição básica como fallback
        description = createFallbackDescription(product)
      }
    }

    // 2. Gerar cards usando Canvas API
    logger.info("Gerando cards com Canvas API")

    // Primeiro template
    const template1Config: CardConfig = {
      template: template1 as any,
      format: "png",
      useGradient,
      customColors: finalCustomColors,
    }

    const pngBlob = await generateProductCard(product, description, template1Config)

    const jpegConfig: CardConfig = {
      ...template1Config,
      format: "jpeg",
      quality: 0.9,
    }

    const jpegBlob = await generateProductCard(product, description, jpegConfig)

    // Criar URLs para os blobs
    const pngUrl = URL.createObjectURL(pngBlob)
    const jpegUrl = URL.createObjectURL(jpegBlob)

    // Resultado inicial
    const result: CardGenerationResult = {
      success: true,
      description,
      pngUrl,
      jpegUrl,
      pngBlob,
      jpegBlob,
      product,
    }

    // Gerar segunda variação se solicitado
    if (includeSecondVariation) {
      logger.info("Gerando segunda variação de cards")

      const template2Config: CardConfig = {
        template: template2 as any,
        format: "png",
        useGradient,
        customColors: finalCustomColors,
      }

      const pngBlob2 = await generateAlternativeCard(product, description, template2Config)

      const jpegConfig2: CardConfig = {
        ...template2Config,
        format: "jpeg",
        quality: 0.9,
      }

      const jpegBlob2 = await generateAlternativeCard(product, description, jpegConfig2)

      // Adicionar segunda variação ao resultado
      result.pngUrl2 = URL.createObjectURL(pngBlob2)
      result.jpegUrl2 = URL.createObjectURL(jpegBlob2)
      result.pngBlob2 = pngBlob2
      result.jpegBlob2 = jpegBlob2
    }

    logger.info("Geração de cards concluída com sucesso")
    return result
  } catch (error: any) {
    logger.error("Erro na geração de cards", { error: error.message })
    return {
      success: false,
      error: error.message || "Erro desconhecido na geração de cards",
    }
  }
}

/**
 * Limpa recursos de URLs criados durante a geração
 * @param result Resultado da geração de cards
 */
export function cleanupCardResources(result: CardGenerationResult): void {
  if (result.pngUrl) URL.revokeObjectURL(result.pngUrl)
  if (result.jpegUrl) URL.revokeObjectURL(result.jpegUrl)
  if (result.pngUrl2) URL.revokeObjectURL(result.pngUrl2)
  if (result.jpegUrl2) URL.revokeObjectURL(result.jpegUrl2)
}

/**
 * Cria uma descrição de fallback quando a IA falha
 * @param product Dados do produto
 * @returns Descrição básica
 */
export function createFallbackDescription(product: any): string {
  // Extract product details
  const productName = product.productName || "Produto"
  const price = Number.parseFloat(product.price || "0").toFixed(2)
  const discountRate = product.priceDiscountRate ? Number.parseInt(product.priceDiscountRate) : 0
  const sales = Number.parseInt(product.sales || "0").toLocaleString("pt-BR")
  const rating = Number.parseFloat(product.ratingStar || "0").toFixed(1)
  const hasFreeShipping = product.freeShipping || false

  // Gerar emojis relevantes com base no nome do produto
  let categoryEmojis = "🛍️ 🔥"
  let categoryHashtags = "#oferta #shopee"

  if (/celular|smartphone|iphone|samsung|xiaomi/i.test(productName)) {
    categoryEmojis = "📱 💯"
    categoryHashtags = "#tech #smartphone #oferta"
  } else if (/roupa|camiseta|blusa|vestido|calça/i.test(productName)) {
    categoryEmojis = "👕 👗"
    categoryHashtags = "#moda #estilo #oferta"
  } else if (/sapato|tênis|sandália|calçado/i.test(productName)) {
    categoryEmojis = "👟 👠"
    categoryHashtags = "#calçados #moda #estilo"
  } else if (/maquiagem|batom|perfume|beleza/i.test(productName)) {
    categoryEmojis = "💄 ✨"
    categoryHashtags = "#beleza #makeup #oferta"
  } else if (/eletrônico|fone|headset|gadget|computador|notebook/i.test(productName)) {
    categoryEmojis = "🔌 💻"
    categoryHashtags = "#tech #gadget #oferta"
  } else if (/joia|colar|pulseira|anel|brinco/i.test(productName)) {
    categoryEmojis = "💍 ✨"
    categoryHashtags = "#acessorios #estilo #oferta"
  } else if (/livro|leitura|literatura/i.test(productName)) {
    categoryEmojis = "📚 📖"
    categoryHashtags = "#livros #leitura #oferta"
  } else if (/cozinha|panela|utensílio|fogão|facas|churrasco/i.test(productName)) {
    categoryEmojis = "🍳 🥘"
    categoryHashtags = "#cozinha #casa #oferta"
  }

  // Frases de chamada para ação
  const callToActions = [
    "CORRE QUE TÁ ACABANDO! 🏃‍♂️",
    "NÃO PERCA ESSA CHANCE! ⏰",
    "GARANTA O SEU AGORA! 👆",
    "APROVEITE ENQUANTO DURA! ⚡",
    "OFERTA POR TEMPO LIMITADO! ⏱️",
    "CLICA NO LINK E GARANTE! 🔗",
    "ÚLTIMAS UNIDADES! 🔥",
  ]

  // Escolher aleatoriamente uma chamada para ação
  const randomCTA = callToActions[Math.floor(Math.random() * callToActions.length)]

  // Generate a description based on product details
  let description = `${categoryEmojis} SUPER OFERTA! ${categoryEmojis}

${productName}

`

  if (discountRate > 0) {
    description += `💰 Com ${discountRate}% OFF! De R$${(Number.parseFloat(price) / (1 - discountRate / 100)).toFixed(2)} por apenas R$${price}
`
  } else {
    description += `💰 Apenas R$${price}
`
  }

  if (rating && rating > 0) {
    description += `⭐ Avaliação: ${rating}/5.0\n`
  }

  description += `🛒 ${sales} pessoas já compraram!\n`

  // Adicionar informação de frete
  if (hasFreeShipping) {
    description += `✅ FRETE GRÁTIS para todo o Brasil!\n`
  }

  description += `\n${randomCTA}

${categoryHashtags} #desconto #promocao`

  return description
}
