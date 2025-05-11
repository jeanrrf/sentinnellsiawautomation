import { NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"
import { renderProductCardTemplate, createFallbackDescription } from "@/lib/template-renderer"
import { getCachedDescription } from "@/lib/redis"

const logger = createLogger("API:GenerateProductCard")

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json()
    const { product, template = "default", description: customDescription } = body

    // Validate the request
    if (!product) {
      logger.warn("Missing product in request")
      return NextResponse.json({ success: false, error: "Produto não fornecido" }, { status: 400 })
    }

    // Log the request
    logger.info("Generating product card", {
      context: {
        productId: product.itemId,
        template,
        hasCustomDescription: !!customDescription,
      },
    })

    // Use custom description if provided, otherwise get from cache or create fallback
    let description = customDescription

    if (!description) {
      // Try to get description from cache
      description = await getCachedDescription(product.itemId)

      // If still no description, create a fallback
      if (!description) {
        logger.debug("No description found, creating fallback")
        description = createFallbackDescription(product)
      }
    }

    // Generate HTML for the product card
    const html = renderProductCardTemplate(product, description, template)

    // Return the response
    return NextResponse.json({
      success: true,
      html,
      productId: product.itemId,
      template,
    })
  } catch (error: any) {
    // Log the error
    logger.error("Error generating product card", {
      details: error,
      context: {
        error: error.message,
        stack: error.stack,
      },
    })

    // Return an error response
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao gerar card do produto",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
