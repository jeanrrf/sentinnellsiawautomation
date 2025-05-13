import { type NextRequest, NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"
import { renderProductCardTemplate } from "@/lib/template-renderer"

const logger = createLogger("generate-multi-format-api")

export async function POST(request: NextRequest) {
  try {
    const { product, description } = await request.json()

    if (!product) {
      logger.warn("Missing product in request")
      return NextResponse.json({ success: false, error: "Product not provided" }, { status: 400 })
    }

    // Log the request
    logger.info("Generating multi-format product cards", {
      context: {
        productId: product.itemId,
        hasDescription: !!description,
      },
    })

    // Generate HTML for the product card
    const html = renderProductCardTemplate(product, description || "", "portrait")

    // Return the response with HTML content
    return NextResponse.json({
      success: true,
      html,
      productId: product.itemId,
    })
  } catch (error: any) {
    // Log the error
    logger.error("Error generating multi-format product cards", {
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
        error: "Error generating product cards",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
