import { NextResponse } from "next/server"
import { renderProductCardTemplate } from "@/lib/template-renderer"
import { isIdProcessed, addProcessedId, getCachedDescription } from "@/lib/redis"

export async function POST(req: Request) {
  try {
    const { productId, useAI, customDescription, videoStyle } = await req.json()

    if (!productId) {
      return NextResponse.json({ success: false, message: "Product ID is required" }, { status: 400 })
    }

    console.log(`Generating video for product ID: ${productId}, useAI: ${useAI}`)

    // Check if this product ID has already been processed
    let processed = false
    try {
      processed = await isIdProcessed(productId)
    } catch (error) {
      console.error("Error checking if ID is processed:", error)
      // Continue even if this check fails
    }

    if (processed) {
      console.log(`Product ${productId} has already been processed, but we'll continue anyway`)
      // We'll continue instead of returning an error
      // This allows users to regenerate cards for the same product
    }

    // Get product data from the products API
    let product = null
    try {
      // Use a direct approach to get the product data
      const productsResponse = await fetch(new URL("/api/products", req.url).toString())

      if (!productsResponse.ok) {
        throw new Error(`Failed to fetch products: ${productsResponse.status} ${productsResponse.statusText}`)
      }

      const productsData = await productsResponse.json()
      product = productsData.products.find((p: any) => p.itemId === productId)

      if (!product) {
        throw new Error("Product not found in the products list")
      }
    } catch (error) {
      console.error("Error fetching product:", error)
      return NextResponse.json(
        {
          success: false,
          message: `Failed to fetch product: ${error.message}`,
        },
        { status: 500 },
      )
    }

    // Get or generate description
    let description = customDescription
    console.log("Custom description:", customDescription)

    // Check if we have a cached description
    if (useAI) {
      try {
        const cachedDescription = await getCachedDescription(productId)
        if (cachedDescription) {
          description = cachedDescription
          console.log("Using cached description for product:", productId)
        } else {
          try {
            const descResponse = await fetch(new URL("/api/generate-description", req.url).toString(), {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ product }),
            })

            if (!descResponse.ok) {
              throw new Error(`Failed to generate description: ${descResponse.status}`)
            }

            const descData = await descResponse.json()
            if (descData.success) {
              description = descData.description
              console.log("Generated description:", description)
            } else {
              throw new Error(descData.message || "Failed to generate description")
            }
          } catch (error) {
            console.error("Error generating description:", error)
            // Fallback description
            description = `🔥 MEGA OFERTA! ${product.productName}\n💰 Apenas R$${product.price}\n⭐ Avaliação: ${product.ratingStar || "N/A"}\n🛍️ ${product.sales} vendidos\n#oferta #shopee #desconto`
          }
        }
      } catch (error) {
        console.error("Error with description handling:", error)
        // Fallback description if all else fails
        description = `🔥 MEGA OFERTA! ${product.productName}\n💰 Apenas R$${product.price}\n⭐ Avaliação: ${product.ratingStar || "N/A"}\n🛍️ ${product.sales} vendidos\n#oferta #shopee #desconto`
      }
    }

    if (!description) {
      description = `🔥 MEGA OFERTA! ${product.productName}\n💰 Apenas R$${product.price}\n⭐ Avaliação: ${product.ratingStar || "N/A"}\n🛍️ ${product.sales} vendidos\n#oferta #shopee #desconto`
    }

    console.log("Final description:", description)

    // Generate HTML template
    const htmlTemplate = renderProductCardTemplate(product, description)

    // Mark the product ID as processed (but don't fail if this doesn't work)
    try {
      await addProcessedId(productId)
    } catch (error) {
      console.error("Error marking product as processed:", error)
      // Continue even if this fails
    }

    // Return the HTML template and other data
    return NextResponse.json({
      success: true,
      htmlTemplate,
      description,
      product,
      previewUrl: `/api/preview/${productId}`,
    })
  } catch (error: any) {
    console.error("Error generating video:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Failed to generate video: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
