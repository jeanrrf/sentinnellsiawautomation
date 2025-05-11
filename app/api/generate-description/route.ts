import { type NextRequest, NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"

const logger = createLogger("generate-description-api")

// Função simplificada para gerar descrições
function generateDescription(product: any): string {
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

export async function POST(request: NextRequest) {
  try {
    const { product } = await request.json()

    if (!product) {
      logger.warn("Missing product in request")
      return NextResponse.json(
        {
          success: false,
          error: "Produto não fornecido",
          message: "AVISO: Nenhum produto foi fornecido para gerar a descrição.",
        },
        { status: 400 },
      )
    }

    logger.info(`Generating description for product: ${product.itemId || "unknown"}`)

    // Gerar descrição
    const description = generateDescription(product)

    return NextResponse.json({
      success: true,
      description,
      source: "local",
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    logger.error("Error generating description", {
      details: error,
    })

    return NextResponse.json(
      {
        success: false,
        error: "Erro ao gerar descrição",
        details: error.message,
        message: "AVISO: Ocorreu um erro ao gerar a descrição do produto.",
      },
      { status: 500 },
    )
  }
}
