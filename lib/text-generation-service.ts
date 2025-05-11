import { createLogger } from "@/lib/logger"
import { getGeminiClient } from "./enhanced-gemini-client"
import { getShopeeService } from "./shopee-product-service"

const logger = createLogger("text-generation-service")

// Tipos de tom para a geração de texto
export enum TextTone {
  YOUTHFUL = "youthful",
  HUMOROUS = "humorous",
  PERSUASIVE = "persuasive",
  PROFESSIONAL = "professional",
  CASUAL = "casual",
}

// Opções para a geração de texto
export interface TextGenerationOptions {
  tone?: TextTone | TextTone[]
  maxLength?: number
  includeEmojis?: boolean
  includeHashtags?: boolean
  highlightDiscount?: boolean
  highlightFeatures?: boolean
  highlightUrgency?: boolean
}

// Opções padrão
const defaultOptions: TextGenerationOptions = {
  tone: [TextTone.YOUTHFUL, TextTone.PERSUASIVE],
  maxLength: 300,
  includeEmojis: true,
  includeHashtags: true,
  highlightDiscount: true,
  highlightFeatures: true,
  highlightUrgency: true,
}

/**
 * Serviço para geração de textos criativos para produtos
 */
export class TextGenerationService {
  /**
   * Gera uma descrição criativa para um produto
   */
  async generateProductDescription(product: any, options: Partial<TextGenerationOptions> = {}): Promise<string> {
    try {
      // Mesclar opções padrão com as fornecidas
      const mergedOptions = { ...defaultOptions, ...options }

      // Obter cliente Gemini
      const geminiClient = getGeminiClient()
      if (!geminiClient) {
        logger.warn("Cliente Gemini não disponível, usando descrição de fallback")
        return this.createFallbackDescription(product, mergedOptions)
      }

      // Tentar obter descrição completa da Shopee
      let fullDescription = ""
      let productAttributes: string[] = []

      if (product.itemId) {
        const shopeeService = getShopeeService()
        if (shopeeService) {
          const productDetails = await shopeeService.getProductDetails(product.itemId)
          if (productDetails) {
            fullDescription = productDetails.description || ""

            // Extrair atributos do produto
            if (productDetails.attributes && productDetails.attributes.length > 0) {
              productAttributes = productDetails.attributes.map((attr) => `${attr.name}: ${attr.value}`)
            }
          }
        }
      }

      // Construir prompt para o Gemini
      const prompt = this.buildCreativePrompt(product, fullDescription, productAttributes, mergedOptions)

      // Gerar texto com o Gemini
      const generatedText = await geminiClient.generateContent(prompt, {
        temperature: 0.8,
        maxOutputTokens: mergedOptions.maxLength || 300,
      })

      return generatedText
    } catch (error: any) {
      logger.error(`Erro ao gerar descrição: ${error.message}`)
      return this.createFallbackDescription(product, options)
    }
  }

  /**
   * Constrói um prompt criativo para o Gemini
   */
  private buildCreativePrompt(
    product: any,
    fullDescription: string,
    attributes: string[],
    options: TextGenerationOptions,
  ): string {
    // Extrair informações relevantes do produto
    const { productName, price, priceDiscountRate, sales, ratingStar, shopName } = product

    // Determinar o tom com base nas opções
    let toneInstructions = ""
    if (Array.isArray(options.tone)) {
      toneInstructions = options.tone.join(", ")
    } else if (options.tone) {
      toneInstructions = options.tone
    } else {
      toneInstructions = "jovem, humorístico e persuasivo"
    }

    // Construir o prompt
    const prompt = `
    Crie uma descrição criativa, envolvente e original para um post de TikTok sobre o seguinte produto da Shopee:
    
    Nome do produto: ${productName}
    Preço: R$ ${price}
    ${priceDiscountRate ? `Desconto: ${priceDiscountRate}%` : ""}
    ${sales ? `Vendas: ${sales}` : ""}
    ${ratingStar ? `Avaliação: ${ratingStar}/5` : ""}
    ${shopName ? `Loja: ${shopName}` : ""}
    
    ${fullDescription ? `Descrição original do produto: ${fullDescription}` : ""}
    
    ${attributes.length > 0 ? `Atributos do produto:\n${attributes.join("\n")}` : ""}
    
    Instruções específicas:
    1. Use um tom ${toneInstructions}
    2. Seja CRIATIVO e ORIGINAL - não apenas repita as informações acima
    3. NÃO mencione o número de vendas ou avaliações - essas informações já estão no card
    4. Foque nos benefícios e características únicas do produto
    5. ${options.includeEmojis ? "Inclua emojis relevantes e chamativos (3-5 emojis)" : "Não use emojis"}
    6. ${options.includeHashtags ? "Inclua 2-3 hashtags relevantes" : "Não use hashtags"}
    7. ${options.highlightDiscount && priceDiscountRate ? "Destaque o desconto de forma criativa" : ""}
    8. ${options.highlightUrgency ? "Crie sensação de urgência e exclusividade" : ""}
    9. Limite a resposta a ${options.maxLength || 300} caracteres
    10. Escreva em português do Brasil, usando linguagem jovem e moderna
    
    Formato da resposta: apenas o texto da descrição, sem explicações adicionais.
    `

    return prompt
  }

  /**
   * Cria uma descrição de fallback quando o Gemini não está disponível
   */
  private createFallbackDescription(product: any, options: Partial<TextGenerationOptions> = {}): string {
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
    } else if (/cozinha|panela|utensílio|fogão/i.test(productName)) {
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

    if (hasFreeShipping) {
      description += `✅ FRETE GRÁTIS para todo o Brasil!\n`
    }

    description += `\n${randomCTA}

${categoryHashtags} #desconto #promocao`

    return description
  }
}

// Instância singleton para uso em toda a aplicação
let textGenerationServiceInstance: TextGenerationService | null = null

/**
 * Obtém a instância singleton do serviço de geração de texto
 */
export function getTextGenerationService(): TextGenerationService {
  if (!textGenerationServiceInstance) {
    textGenerationServiceInstance = new TextGenerationService()
  }

  return textGenerationServiceInstance
}
