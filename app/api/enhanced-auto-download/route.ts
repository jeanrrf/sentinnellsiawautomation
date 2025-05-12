import { type NextRequest, NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"
import { getCachedProducts } from "@/lib/redis"
import { createFallbackDescription } from "@/lib/card-generation-service"

const logger = createLogger("API:EnhancedAutoDownload")

// Lista de todos os templates disponíveis
const AVAILABLE_TEMPLATES = ["modern", "minimal", "bold", "elegant", "vibrant"]

export async function GET(req: NextRequest) {
  try {
    logger.info("Enhanced auto-download request received")
    const { searchParams } = new URL(req.url)
    const productId = searchParams.get("productId")

    // Obter produtos do cache
    const products = await getCachedProducts()
    let selectedProduct

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

    // Se um ID específico foi fornecido, buscar esse produto
    if (productId) {
      selectedProduct = products.find((p) => p.itemId === productId)
      if (!selectedProduct) {
        logger.warn(`Product with ID ${productId} not found, selecting random product`)
      }
    }

    // Se não encontrou o produto específico ou nenhum ID foi fornecido, selecionar aleatoriamente
    if (!selectedProduct) {
      const randomIndex = Math.floor(Math.random() * products.length)
      selectedProduct = products[randomIndex]
    }

    logger.info(`Selected product: ${selectedProduct.itemId} - ${selectedProduct.productName}`)

    // Gerar descrição
    let description = ""
    try {
      const descResponse = await fetch(`${req.nextUrl.origin}/api/generate-description`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ product: selectedProduct }),
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
      description = createFallbackDescription(selectedProduct)
    }

    // Retornar JSON com informações para download
    return NextResponse.json({
      success: true,
      product: selectedProduct,
      description: description,
      templates: AVAILABLE_TEMPLATES,
      downloadUrls: AVAILABLE_TEMPLATES.reduce((acc, template) => {
        acc[template] = `${req.nextUrl.origin}/api/download-card/${selectedProduct.itemId}?template=${template}`
        return acc
      }, {}),
      descriptionUrl: `${req.nextUrl.origin}/api/download-description/${selectedProduct.itemId}`,
      message: "Use the provided URLs to download the product cards and description",
    })
  } catch (error) {
    logger.error("Error in enhanced auto-download:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate download page",
        error: error.message,
      },
      { status: 500 },
    )
  }
}
