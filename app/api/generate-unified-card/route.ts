import { type NextRequest, NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"
import { generateCardsForProduct } from "@/lib/card-generation-service"
import { getCachedProducts } from "@/lib/redis"

const logger = createLogger("API:UnifiedCardGeneration")

export async function POST(req: NextRequest) {
  try {
    logger.info("Unified card generation request received")

    const body = await req.json()
    const { productId, options = {} } = body

    // Validar parâmetros
    if (!productId) {
      logger.warn("Missing productId in request")
      return NextResponse.json(
        {
          success: false,
          message: "productId is required",
        },
        { status: 400 },
      )
    }

    // Buscar produto do cache
    const products = await getCachedProducts()

    if (!products || !Array.isArray(products) || products.length === 0) {
      logger.error("No products found in cache")
      return NextResponse.json(
        {
          success: false,
          message: "No products found in cache",
        },
        { status: 404 },
      )
    }

    // Encontrar o produto pelo ID
    const product = products.find((p) => p.itemId === productId)

    if (!product) {
      logger.error(`Product with ID ${productId} not found`)
      return NextResponse.json(
        {
          success: false,
          message: `Product with ID ${productId} not found`,
        },
        { status: 404 },
      )
    }

    // Gerar cards usando o serviço centralizado
    // Não podemos retornar os blobs diretamente, então vamos gerar URLs temporárias
    const apiBaseUrl = req.nextUrl.origin
    const cardResult = await generateCardsForProduct(product, options, apiBaseUrl)

    if (!cardResult.success) {
      logger.error(`Failed to generate cards: ${cardResult.error}`)
      return NextResponse.json(
        {
          success: false,
          message: cardResult.error || "Failed to generate cards",
        },
        { status: 500 },
      )
    }

    // Retornar apenas os dados necessários (sem os blobs)
    return NextResponse.json({
      success: true,
      product: cardResult.product,
      description: cardResult.description,
      // Incluir URLs para download direto dos cards
      downloadUrls: {
        png: `/api/download-card/${productId}?format=png&template=${options.template1 || "modern"}`,
        jpeg: `/api/download-card/${productId}?format=jpeg&template=${options.template1 || "modern"}`,
        png2: options.includeSecondVariation
          ? `/api/download-card/${productId}?format=png&template=${options.template2 || "bold"}`
          : null,
        jpeg2: options.includeSecondVariation
          ? `/api/download-card/${productId}?format=jpeg&template=${options.template2 || "bold"}`
          : null,
        all: `/api/download-card-package/${productId}`,
        text: `/api/download-description/${productId}`,
      },
    })
  } catch (error) {
    logger.error("Error in unified card generation:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate cards",
        error: error.message,
      },
      { status: 500 },
    )
  }
}
