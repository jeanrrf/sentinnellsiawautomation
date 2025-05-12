import { type NextRequest, NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"
import { getCachedProducts } from "@/lib/redis"

const logger = createLogger("API:SuperCardDownload")

export async function GET(req: NextRequest) {
  try {
    logger.info("Super card download request received")
    const { searchParams } = new URL(req.url)
    const productId = searchParams.get("productId")
    const template = searchParams.get("template") || "modern"

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

    // Retornar JSON com informações para download
    return NextResponse.json({
      success: true,
      product: selectedProduct,
      downloadUrl: `${req.nextUrl.origin}/api/download-card/${selectedProduct.itemId}?template=${template}`,
      message: "Use the provided URL to download the product card",
    })
  } catch (error) {
    logger.error("Error in super card download:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate download information",
        error: error.message,
      },
      { status: 500 },
    )
  }
}
