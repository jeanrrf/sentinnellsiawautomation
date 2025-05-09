import { NextResponse } from "next/server"
import { getCachedDescription, cacheDescription } from "@/lib/redis"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

export async function POST(req: Request) {
  try {
    const { product } = await req.json()

    if (!product) {
      return NextResponse.json({ success: false, message: "Product data is required" }, { status: 400 })
    }

    // Check if description is already cached
    try {
      const cachedDescription = await getCachedDescription(product.itemId)
      if (cachedDescription) {
        console.log(`Using cached description for product ${product.itemId}`)
        return NextResponse.json({
          success: true,
          description: cachedDescription,
          source: "cache",
        })
      }
    } catch (error) {
      console.error("Error checking cache:", error)
      // Continue with generation if cache check fails
    }

    if (!GEMINI_API_KEY) {
      console.log("Gemini API key not configured, using fallback description")
      const fallbackDescription = createFallbackDescription(product)

      // Try to cache the fallback description
      try {
        await cacheDescription(product.itemId, fallbackDescription)
      } catch (cacheError) {
        console.error("Error caching fallback description:", cacheError)
      }

      return NextResponse.json({
        success: true,
        description: fallbackDescription,
        source: "fallback",
      })
    }

    const prompt = `
      Você é um copywriter de elite especializado em marketing digital viral e persuasão, focado em criar desejo e urgência para produtos em plataformas como TikTok e Instagram Reels.
      Sua missão é transformar as informações sobre este produto em um texto curto, irresistível e altamente criativo que maximize cliques e conversões.

      PRODUTO FORNECIDO:
      - Nome: ${product.productName}
      - Preço: R$ ${product.price}
      - Avaliação (Estrelas): ${product.ratingStar || "N/A"} ⭐
      - Unidades Vendidas: ${product.sales}
      - Nome da Loja: ${product.shopName}

      DIRETRIZES CRÍTICAS PARA UM TEXTO PERFEITO:
      1. Impacto Imediato: Comece com uma frase ultra-cativante que chame atenção instantaneamente.
      2. Desejo e Benefício Central: Descreva o produto de forma vibrante, focando no benefício principal.
      3. Prova Social Integrada: Mencione popularidade (vendas, avaliação).
      4. Oferta Irresistível (Preço): Apresente o preço como uma oportunidade única.
      5. Chamada para Ação Magnética: Use uma CTA clara e direta com senso de urgência.
      6. Emojis Estratégicos: Use 3-4 emojis que reforcem a mensagem.
      7. Hashtags Relevantes: Inclua 2-3 hashtags curtas, populares e específicas do nicho.
      8. Tom de Voz: Jovem, autêntico, energético, confiante, divertido e levemente informal.
      9. LIMITE ESTRITO: MÁXIMO de 150 caracteres para o texto principal (excluindo hashtags).
      10. Originalidade: Evite clichês desgastados.

      FORMATO DE RESPOSTA:
      - Texto principal: Máximo de 150 caracteres
      - Hashtags: 2-3 hashtags curtas no final

      Responda APENAS com a descrição do produto, sem comentários adicionais antes ou depois.
    `

    try {
      // Direct API call to Gemini
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 200,
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error("Gemini API error:", errorData)
        throw new Error("Failed to generate description from API")
      }

      const data = await response.json()

      // Extract the generated text from the response
      let generatedText = ""
      if (data.candidates && data.candidates.length > 0) {
        const content = data.candidates[0].content
        if (content && content.parts && content.parts.length > 0) {
          generatedText = content.parts[0].text
        }
      }

      if (!generatedText) {
        throw new Error("No text generated from API")
      }

      // Verificar se a descrição gerada está dentro do limite
      let finalDescription = generatedText.trim()

      // Limitar o tamanho da descrição se necessário
      if (finalDescription.length > 200) {
        console.log(`Description too long (${finalDescription.length} chars), truncating...`)
        // Encontrar um ponto final ou quebra de linha para truncar de forma mais natural
        const breakPoint = Math.max(
          finalDescription.lastIndexOf(".", 200),
          finalDescription.lastIndexOf("\n", 200),
          finalDescription.lastIndexOf("!", 200),
          finalDescription.lastIndexOf("?", 200),
        )

        if (breakPoint > 100) {
          finalDescription = finalDescription.substring(0, breakPoint + 1)
        } else {
          // Se não encontrar um ponto natural, cortar em 200 caracteres
          finalDescription = finalDescription.substring(0, 200)
        }
      }

      // Try to cache the generated description
      try {
        await cacheDescription(product.itemId, finalDescription)
      } catch (cacheError) {
        console.error(`Error caching description for product ${product.itemId}:`, cacheError)
        // Continue even if caching fails
      }

      return NextResponse.json({
        success: true,
        description: finalDescription,
        source: "api",
      })
    } catch (apiError) {
      console.error("Error with Gemini API:", apiError)

      // If there's an API error, create a fallback description
      const fallbackDescription = createFallbackDescription(product)

      // Try to cache the fallback description
      try {
        await cacheDescription(product.itemId, fallbackDescription)
      } catch (cacheError) {
        console.error("Error caching fallback description:", cacheError)
      }

      return NextResponse.json({
        success: true,
        description: fallbackDescription,
        note: "Used fallback description due to API error",
        source: "fallback",
      })
    }
  } catch (error) {
    console.error("Error generating description:", error)

    // If there's an error, create a fallback description
    try {
      const { product } = await req.json()
      const fallbackDescription = createFallbackDescription(product)

      return NextResponse.json({
        success: true,
        description: fallbackDescription,
        note: "Used fallback description due to error",
        source: "fallback",
      })
    } catch (e) {
      return NextResponse.json({
        success: false,
        message: "Failed to generate description",
        description: "🔥 OFERTA IMPERDÍVEL! Produto incrível com preço especial! Aproveite agora! #oferta #shopee",
        source: "emergency-fallback",
      })
    }
  }
}

// Fallback description generator
function createFallbackDescription(product: any) {
  const price = Number.parseFloat(product.price)
  const stars = Number.parseFloat(product.ratingStar || "4.5")
  const sales = Number.parseInt(product.sales)

  // Criar uma descrição curta e direta
  const urgency = sales > 1000 ? "🔥 OFERTA IMPERDÍVEL!" : "⚡ PROMOÇÃO!"
  const rating = "⭐".repeat(Math.min(Math.round(stars), 5))

  // Limitar o nome do produto a 30 caracteres
  const shortName = product.productName.length > 30 ? product.productName.substring(0, 30) + "..." : product.productName

  return `${urgency}\n${shortName}\n${rating}\nApenas R$${price.toFixed(2)}\nJá vendidos: ${sales}\n#oferta #shopee`
}
