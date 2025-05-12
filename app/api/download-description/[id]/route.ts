import { type NextRequest, NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"
import { createFallbackDescription } from "@/lib/template-renderer"
import { getCachedProducts } from "@/lib/redis"

const logger = createLogger("API:DownloadDescription")

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const productId = params.id
    logger.info(`Download description request for product ID: ${productId}`)

    // Try to get product from cache
    let product
    try {
      const products = await getCachedProducts()

      if (products && Array.isArray(products)) {
        product = products.find((p) => p.itemId === productId)
      }

      if (!product) {
        logger.warning(`Product with ID ${productId} not found, using fallback`)
        // Use a fallback product
        product = {
          itemId: productId,
          productName: "Produto não encontrado",
          price: "0.00",
          shopName: "Loja Desconhecida",
          sales: 0,
          ratingStar: 0,
          offerLink: "#",
        }
      }
    } catch (error) {
      logger.error("Error fetching product:", error)
      return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 })
    }

    // Create description
    const description = product.description || createFallbackDescription(product)

    // Create text content
    const textContent = `
Product: ${product.productName}
ID: ${product.itemId}
Price: R$ ${Number(product.price).toFixed(2)}
Shop: ${product.shopName || "Unknown"}
Sales: ${product.sales}
Rating: ${product.ratingStar || "N/A"}

Description:
${description}

Link: ${product.offerLink || "N/A"}
`.trim()

    // Return as text file
    return new NextResponse(textContent, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="product_${productId}_info.txt"`,
      },
    })
  } catch (error) {
    logger.error("Error generating description:", error)
    return NextResponse.json({ error: "Failed to generate description" }, { status: 500 })
  }
}
