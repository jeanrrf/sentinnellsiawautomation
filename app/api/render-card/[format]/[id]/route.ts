import { type NextRequest, NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"
import crypto from "crypto"
import { ImageResponse } from "@vercel/og"
import { createFallbackDescription } from "@/lib/template-renderer"

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

    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 })
    }

    if (!["png", "jpeg", "jpg"].includes(format.toLowerCase())) {
      return NextResponse.json({ error: "Invalid format. Supported formats: png, jpeg, jpg" }, { status: 400 })
    }

    logger.info(`Rendering card for product ${id} in ${format} format`)

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

    // Generate card HTML
    const cardHtml = generateCardHtml(product, description)

    // Create image response with @vercel/og
    const imageResponse = new ImageResponse(cardHtml, {
      width: 1080,
      height: 1920,
      // Format based on request
      ...(format.toLowerCase() === "png" ? { type: "png" } : { type: "jpeg", quality: 90 }),
    })

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

// Function to generate card HTML for @vercel/og
function generateCardHtml(product: any, description: string) {
  const discountRate = Number.parseFloat(product.priceDiscountRate || "0") / 100
  const hasDiscount = discountRate > 0
  const originalPrice = hasDiscount ? (Number.parseFloat(product.price) / (1 - discountRate)).toFixed(2) : null

  // Não use JSX aqui, pois está causando problemas de sintaxe
  // Em vez disso, retorne uma string HTML simples
  return `
    <div style="display:flex;flex-direction:column;width:100%;height:100%;background-color:#000000;color:#ffffff;font-family:sans-serif;position:relative;">
      <div style="display:flex;justify-content:center;align-items:center;width:100%;height:60%;overflow:hidden;position:relative;">
        <img src="${product.imageUrl || "/placeholder.svg"}" alt="${product.productName}" style="width:100%;height:100%;object-fit:contain;" />
        ${hasDiscount ? `<div style="position:absolute;top:20px;right:20px;background-color:#ff4d4f;color:white;padding:8px 16px;border-radius:20px;font-weight:bold;font-size:24px;">-${Math.round(discountRate * 100)}%</div>` : ""}
      </div>
      <div style="padding:32px;display:flex;flex-direction:column;gap:16px;flex:1;">
        <h1 style="font-size:32px;font-weight:bold;margin:0;line-height:1.2;">${product.productName}</h1>
        <div style="display:flex;align-items:center;gap:12px;">
          <span style="font-size:40px;font-weight:bold;color:#ff4d4f;">R$ ${product.price}</span>
          ${hasDiscount ? `<span style="font-size:24px;text-decoration:line-through;color:#999999;">R$ ${originalPrice}</span>` : ""}
        </div>
        <div style="display:flex;align-items:center;gap:8px;font-size:20px;">
          <span>Loja: ${product.shopName}</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;font-size:20px;">
          <span>⭐ ${product.ratingStar}</span>
          <span>•</span>
          <span>Vendas: ${product.sales}</span>
        </div>
        <div style="margin-top:auto;background-color:#ff4d4f;padding:16px;border-radius:8px;text-align:center;font-size:24px;font-weight:bold;">
          COMPRE AGORA • LINK NA BIO
        </div>
      </div>
    </div>
  `
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
