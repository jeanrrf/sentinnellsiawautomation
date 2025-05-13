import { type NextRequest, NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"
import crypto from "crypto"
import { createFallbackDescription } from "@/lib/template-renderer"
import { generateProductOgCard, type CardGenerationOptions } from "@/lib/og-card-service"

const logger = createLogger("render-card-api")

// Shopee API credentials from environment variables
const SHOPEE_APP_ID = process.env.SHOPEE_APP_ID
const SHOPEE_APP_SECRET = process.env.SHOPEE_APP_SECRET
const SHOPEE_AFFILIATE_API_URL = process.env.SHOPEE_AFFILIATE_API_URL

// Function to generate signature for Shopee API authentication
function generateSignature(appId: string, timestamp: number, payload: string, secret: string) {
  const baseString = `${appId}${timestamp}${payload}${secret}`
  return crypto.createHash("sha256").update(baseString).digest("hex")
}

export async function GET(request: NextRequest, { params }: { params: { format: string; id: string } }) {
  try {
    const { format, id } = params
    const searchParams = request.nextUrl.searchParams

    // Validar parâmetros
    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 })
    }

    if (!["png", "jpeg", "jpg"].includes(format.toLowerCase())) {
      return NextResponse.json({ error: "Invalid format. Supported formats: png, jpeg, jpg" }, { status: 400 })
    }

    logger.info(`Rendering card for product ${id} in ${format} format`)

    // Extrair opções de estilo dos parâmetros de consulta
    const style = (searchParams.get("style") as any) || "standard"
    const theme = (searchParams.get("theme") as any) || "dark"
    const colorScheme = (searchParams.get("colorScheme") as any) || "red"
    const layout = (searchParams.get("layout") as any) || "standard"
    const showBadges = searchParams.get("showBadges") !== "false"
    const showRating = searchParams.get("showRating") !== "false"
    const showShopName = searchParams.get("showShopName") !== "false"

    // Configurar opções para geração do card
    const cardOptions: CardGenerationOptions = {
      style,
      theme,
      colorScheme,
      layout,
      showBadges,
      showRating,
      showShopName,
      format: format === "png" ? "png" : "jpeg",
      quality: format === "png" ? undefined : 90,
    }

    // Fetch product data from Shopee API
    const product = await fetchProductFromShopee(id)

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Generate description using Gemini
    const descriptionResponse = await fetch(`${request.nextUrl.origin}/api/generate-description`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ product }),
    })

    let description = ""
    if (descriptionResponse.ok) {
      const descriptionData = await descriptionResponse.json()
      description = descriptionData.description || ""
    } else {
      logger.warn("Failed to generate description, using fallback")
      description = createFallbackDescription(product)
    }

    // Gerar o card usando o serviço OG
    const imageResponse = await generateProductOgCard(product, description, cardOptions)

    // Add custom headers
    const headers = new Headers(imageResponse.headers)
    headers.set("X-Product-Name", encodeURIComponent(product.productName))
    headers.set("X-Product-Price", product.price)
    headers.set("X-Product-Description", encodeURIComponent(description))
    headers.set("Cache-Control", "public, max-age=3600")

    // Return the image with appropriate headers
    return new Response(imageResponse.body, {
      status: imageResponse.status,
      headers,
    })
  } catch (error: any) {
    logger.error(`Error rendering card: ${error.message}`, error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function fetchProductFromShopee(itemId: string) {
  if (!SHOPEE_APP_ID || !SHOPEE_APP_SECRET || !SHOPEE_AFFILIATE_API_URL) {
    throw new Error("Shopee API credentials not configured")
  }

  const timestamp = Math.floor(Date.now() / 1000)

  // Build GraphQL query for Shopee API
  const query = `
    query GetProduct($itemId: String!) {
      productOfferV2(itemId: $itemId) {
        nodes {
          itemId
          productName
          commissionRate
          price
          priceDiscountRate
          priceMin
          priceMax
          sales
          imageUrl
          shopName
          offerLink
          ratingStar
        }
      }
    }
  `

  const variables = {
    itemId,
  }

  const payload = JSON.stringify({ query, variables })
  const signature = generateSignature(SHOPEE_APP_ID, timestamp, payload, SHOPEE_APP_SECRET)

  const headers = {
    Authorization: `SHA256 Credential=${SHOPEE_APP_ID}, Timestamp=${timestamp}, Signature=${signature}`,
    "Content-Type": "application/json",
  }

  logger.info(`Fetching product ${itemId} from Shopee API`)

  // Make the actual request to Shopee API
  const response = await fetch(SHOPEE_AFFILIATE_API_URL, {
    method: "POST",
    headers,
    body: payload,
  })

  if (!response.ok) {
    throw new Error(`Shopee API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()

  // Check if the response contains the product
  const products = data?.data?.productOfferV2?.nodes || []

  if (products.length === 0) {
    return null
  }

  const product = products[0]

  // Process the product data
  const price = Number.parseFloat(product.price)
  const discountRate = Number.parseFloat(product.priceDiscountRate || "0") / 100

  // Calculate original price if there's a discount
  let originalPrice = null
  if (discountRate > 0) {
    originalPrice = (price / (1 - discountRate)).toFixed(2)
  }

  return {
    ...product,
    calculatedOriginalPrice: originalPrice,
  }
}
