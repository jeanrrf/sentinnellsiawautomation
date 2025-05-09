import { NextResponse } from "next/server"
import { renderProductCardTemplate } from "@/lib/template-renderer"
import { getCachedDescription } from "@/lib/redis"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const productId = params.id
    console.log(`Generating preview for product ID: ${productId}`)

    // Fetch product data from the products API
    const productsResponse = await fetch(new URL("/api/products", request.url).toString())

    if (!productsResponse.ok) {
      console.error(`Failed to fetch products: ${productsResponse.status} ${productsResponse.statusText}`)
      return new NextResponse(`Failed to fetch products: ${productsResponse.status} ${productsResponse.statusText}`, {
        status: productsResponse.status,
        headers: {
          "Content-Type": "text/plain",
        },
      })
    }

    const productsData = await productsResponse.json()
    const product = productsData.products.find((p: any) => p.itemId === productId)

    if (!product) {
      console.error(`Product not found: ${productId}`)
      return new NextResponse(`Product not found: ${productId}`, {
        status: 404,
        headers: {
          "Content-Type": "text/plain",
        },
      })
    }

    // Try to get cached description
    let description
    try {
      description = await getCachedDescription(productId)
      console.log(`Description for product ${productId}:`, description ? "Found in cache" : "Not found in cache")
    } catch (error) {
      console.error(`Error getting cached description for product ${productId}:`, error)
    }

    // If no cached description, generate a simple one
    if (!description) {
      description = `🔥 MEGA OFERTA! ${product.productName}\n💰 Apenas R$${product.price}\n⭐ Avaliação: ${product.ratingStar || "N/A"}\n🛍️ ${product.sales} vendidos\n#oferta #shopee #desconto`
      console.log(`Generated fallback description for product ${productId}`)
    }

    // Generate HTML template
    const htmlTemplate = renderProductCardTemplate(product, description)

    // Return the HTML directly
    return new NextResponse(htmlTemplate, {
      headers: {
        "Content-Type": "text/html",
      },
    })
  } catch (error) {
    console.error("Error generating preview:", error)
    return new NextResponse(`Error generating preview: ${error.message}`, {
      status: 500,
      headers: {
        "Content-Type": "text/plain",
      },
    })
  }
}
