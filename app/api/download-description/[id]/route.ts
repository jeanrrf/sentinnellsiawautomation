import { type NextRequest, NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"
import { getCachedProducts } from "@/lib/redis"
import { createFallbackDescription } from "@/lib/card-generation-service"

const logger = createLogger("API:DownloadDescription")

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const productId = params.id
    logger.info(`Description download request received for product ${productId}`)

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

    // Tentar obter descrição da API ou usar fallback
    let description = ""
    try {
      const descResponse = await fetch(`${req.nextUrl.origin}/api/generate-description`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ product }),
      })

      if (descResponse.ok) {
        const descData = await descResponse.json()
        if (descData.success) {
          description = descData.description
        } else {
          throw new Error(descData.error || "Failed to generate description")
        }
      } else {
        throw new Error(`API returned ${descResponse.status}`)
      }
    } catch (error) {
      logger.warn("Failed to generate description, using fallback", { error })
      description = createFallbackDescription(product)
    }

    // Adicionar link de afiliado à descrição
    const fullDescription = `${description}\n\n📲 LINK: ${product.offerLink || ""}`

    // Criar blob de texto
    const textBlob = new Blob([fullDescription], { type: "text/plain" })
    const textBuffer = await textBlob.arrayBuffer()

    // Retornar o texto como resposta
    return new NextResponse(textBuffer, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="product_${productId}_description.txt"`,
      },
    })
  } catch (error) {
    logger.error("Error in description download:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate description",
        error: error.message,
      },
      { status: 500 },
    )
  }
}
