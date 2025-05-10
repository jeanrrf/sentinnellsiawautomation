import { NextResponse } from "next/server"
import { isIdProcessed, addProcessedId, getCachedDescription } from "@/lib/redis"
import { renderProductCardTemplate } from "@/lib/template-renderer"

export async function POST(req: Request) {
  try {
    const { productId, useAI, customDescription, videoStyle } = await req.json()

    if (!productId) {
      return NextResponse.json({ success: false, message: "Product ID is required" }, { status: 400 })
    }

    console.log(`Generating video for product ID: ${productId}, useAI: ${useAI}, style: ${videoStyle}`)

    // Check if this product ID has already been processed
    let processed = false
    try {
      processed = await isIdProcessed(productId)
      console.log(`Product ${productId} processed status:`, processed)
    } catch (error) {
      console.error("Error checking if ID is processed:", error)
      // Continue even if this check fails
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
    let descriptionSource = "custom"
    console.log("Custom description:", customDescription)

    // If using AI, try to get a description
    if (useAI) {
      try {
        // First try to get cached description
        try {
          const cachedDescription = await getCachedDescription(productId)
          if (cachedDescription) {
            description = cachedDescription
            descriptionSource = "cache"
            console.log("Using cached description for product:", productId)
          }
        } catch (cacheError) {
          console.error("Error getting cached description:", cacheError)
        }

        // If no cached description, try to generate one
        if (!description) {
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
              descriptionSource = descData.source || "api"
              console.log("Generated description:", description)
            } else {
              throw new Error(descData.message || "Failed to generate description")
            }
          } catch (error) {
            console.error("Error generating description:", error)
            // Fallback description
            description = createFallbackDescription(product)
            descriptionSource = "fallback"
          }
        }
      } catch (error) {
        console.error("Error with description handling:", error)
        // Fallback description if all else fails
        description = createFallbackDescription(product)
        descriptionSource = "fallback"
      }
    }

    if (!description) {
      description = createFallbackDescription(product)
      descriptionSource = "fallback"
    }

    console.log("Final description:", description)

    // Generate HTML template
    const htmlTemplate = renderProductCardTemplate(product, description, videoStyle)

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
      descriptionSource,
      product,
      previewUrl: `/api/preview/${productId}?style=${videoStyle}`,
      style: videoStyle,
      timestamp: new Date().toISOString(),
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

// Fallback description generator
function createFallbackDescription(product: any) {
  const price = Number.parseFloat(product.price)
  const stars = Number.parseFloat(product.ratingStar || "4.5")
  const sales = Number.parseInt(product.sales)

  // Criar uma descrição curta e direta
  const urgency = sales > 1000 ? "🔥 OFERTA IMPERDÍVEL!" : "⚡ PROMOÇÃO!"
  const rating = "⭐".repeat(Math.min(Math.round(stars), 5))

  // Limitar o nome do produto a 30 caracteres
  const shortName = product.productName.length > 30 ? product.productName.substring(0, 30) + "..." : product.productName

  return `${urgency}\n${shortName}\n${rating}\nApenas R$${price.toFixed(2)}\nJá vendidos: ${sales}\n#oferta #shopee`
}
