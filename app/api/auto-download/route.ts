import { type NextRequest, NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"
import { createFallbackDescription } from "@/lib/template-renderer"
import { getCachedProducts } from "@/lib/redis"

const logger = createLogger("API:AutoDownload")

// Sample product data to use when Redis is unavailable
const SAMPLE_PRODUCT = {
  itemId: "sample123",
  productName: "Produto Demonstração",
  price: "99.90",
  shopName: "Loja Exemplo",
  sales: 1234,
  ratingStar: 4.8,
  offerLink: "https://example.com/product",
  images: ["https://via.placeholder.com/500"],
  description: "Este é um produto de demonstração usado quando não há conexão com o Redis.",
  categories: ["Exemplo", "Demonstração"],
  discount: 20,
  originalPrice: "129.90",
}

export async function GET(req: NextRequest) {
  try {
    logger.info("Auto-download request received")

    // Try to get products from cache
    let product
    try {
      const products = await getCachedProducts()

      if (products && Array.isArray(products) && products.length > 0) {
        // Select a random product
        const randomIndex = Math.floor(Math.random() * products.length)
        product = products[randomIndex]
        logger.info(`Selected random product: ${product.itemId}`)
      } else {
        // Use sample product if no products found
        logger.warning("No products found in cache, using sample product")
        product = SAMPLE_PRODUCT
      }
    } catch (error) {
      // Handle Redis connection error
      logger.error("Error connecting to Redis:", error)
      logger.warning("Using sample product due to Redis connection error")
      product = SAMPLE_PRODUCT
    }

    // Create description
    const description = product.description || createFallbackDescription(product)

    // Return JSON response with product data and download URLs
    return NextResponse.json({
      success: true,
      product: {
        ...product,
        description,
      },
      downloadUrls: {
        modern: `/api/download-card/${product.itemId}?template=modern`,
        agemini: `/api/download-card/${product.itemId}?template=agemini`,
        description: `/api/download-description/${product.itemId}`,
      },
      message: "Use the provided URLs to download the product cards and description",
    })
  } catch (error) {
    logger.error("Error in auto-download:", error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Unknown error occurred",
        message: "Failed to generate product cards",
      },
      { status: 500 },
    )
  }
}
