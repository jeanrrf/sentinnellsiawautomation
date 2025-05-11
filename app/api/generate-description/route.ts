import { type NextRequest, NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"

const logger = createLogger("generate-description-api")

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

    // Tentar gerar com Gemini primeiro
    try {
      const geminiDescription = await generateWithGemini(product)
      return NextResponse.json({
        success: true,
        description: geminiDescription,
      })
    } catch (geminiError) {
      logger.error("Error generating with Gemini:", geminiError)

      // Fallback para descrição aprimorada
      const enhancedDescription = generateEnhancedDescription(product)

      return NextResponse.json({
        success: true,
        description: enhancedDescription,
        warning: "Usando descrição gerada localmente devido a problemas com o serviço de IA.",
      })
    }
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

// Function to generate description using Gemini API
async function generateWithGemini(product: any) {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY não configurada")
  }

  // Extract relevant product information
  const { productName, price, priceDiscountRate, sales, ratingStar, shopName } = product

  // Create enhanced prompt for Gemini
  const prompt = `
    Crie uma descrição persuasiva e envolvente para um post de TikTok sobre o seguinte produto da Shopee:
    
    Nome do produto: ${productName}
    Preço: R$ ${price}
    Desconto: ${priceDiscountRate || "0"}%
    Vendas: ${sales}
    Avaliação: ${ratingStar || "4.5"}/5
    Loja: ${shopName || "Loja Oficial"}
    
    A descrição deve:
    1. Ter entre 100-150 caracteres
    2. Incluir emojis relevantes e chamativos (3-5 emojis)
    3. Destacar o preço e qualquer desconto de forma atraente
    4. Ter uma chamada para ação urgente que incentive a compra imediata
    5. Incluir hashtags relevantes como #shopee #oferta #desconto
    6. Usar linguagem moderna, natural e conversacional
    7. Criar sensação de urgência e exclusividade
    8. Ser otimizada para SEO e altas taxas de conversão
    9. Mencionar benefícios específicos do produto
    10. Ser escrita em português do Brasil
    
    Formato da resposta: apenas o texto da descrição, sem explicações adicionais.
  `

  try {
    // Corrigindo a URL da API Gemini para usar a versão correta
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 200,
          },
        }),
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      logger.error(`Gemini API error response: ${errorText}`)
      throw new Error(`Erro na API Gemini: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    // Extract the generated text with better error handling
    if (
      data &&
      data.candidates &&
      Array.isArray(data.candidates) &&
      data.candidates.length > 0 &&
      data.candidates[0].content &&
      data.candidates[0].content.parts &&
      Array.isArray(data.candidates[0].content.parts) &&
      data.candidates[0].content.parts.length > 0
    ) {
      const generatedText = data.candidates[0].content.parts[0].text
      return generatedText.trim()
    }

    logger.error(`Invalid Gemini API response format: ${JSON.stringify(data)}`)
    throw new Error("Formato de resposta inválido da API Gemini")
  } catch (error) {
    logger.error("Error calling Gemini API:", error)
    throw error
  }
}

// Função para gerar uma descrição aprimorada quando a IA falhar
function generateEnhancedDescription(product: any) {
  // Extract product details
  const productName = product.productName || "Produto"
  const price = Number.parseFloat(product.price || "0").toFixed(2)
  const discountRate = product.priceDiscountRate ? Number.parseInt(product.priceDiscountRate) : 0
  const sales = Number.parseInt(product.sales || "0").toLocaleString("pt-BR")
  const rating = Number.parseFloat(product.ratingStar || "0").toFixed(1)

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

  if (rating && rating > 0) {
    description += `⭐ Avaliação: ${rating}/5.0\n`
  }

  description += `🛒 ${sales} pessoas já compraram!

${randomCTA}

${categoryHashtags} #desconto #promocao`

  return description
}
