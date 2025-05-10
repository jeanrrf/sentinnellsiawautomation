import { NextResponse } from "next/server"
import crypto from "crypto"
import { cacheProducts } from "@/lib/redis"

// Shopee API credentials from environment variables
const SHOPEE_APP_ID = process.env.SHOPEE_APP_ID
const SHOPEE_APP_SECRET = process.env.SHOPEE_APP_SECRET
const SHOPEE_AFFILIATE_API_URL = process.env.SHOPEE_AFFILIATE_API_URL

function generateSignature(appId: string, timestamp: number, payload: string, secret: string) {
  const baseString = `${appId}${timestamp}${payload}${secret}`
  return crypto.createHash("sha256").update(baseString).digest("hex")
}

export async function POST() {
  try {
    if (!SHOPEE_APP_ID || !SHOPEE_APP_SECRET || !SHOPEE_AFFILIATE_API_URL) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing Shopee API credentials. Please check your environment variables.",
        },
        { status: 500 },
      )
    }

    const timestamp = Math.floor(Date.now() / 1000)

    const query = `
      query GetBestSellers($page: Int!, $limit: Int!, $sortType: Int) {
        productOfferV2(page: $page, limit: $limit, sortType: $sortType) {
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

    // Limitando para 5 produtos e usando sortType 2 para best sellers
    const variables = { page: 1, limit: 5, sortType: 2 }
    const payload = JSON.stringify({ query, variables })

    const signature = generateSignature(SHOPEE_APP_ID, timestamp, payload, SHOPEE_APP_SECRET)

    const headers = {
      Authorization: `SHA256 Credential=${SHOPEE_APP_ID}, Timestamp=${timestamp}, Signature=${signature}`,
      "Content-Type": "application/json",
    }

    console.log("Fetching from Shopee API with URL:", SHOPEE_AFFILIATE_API_URL)

    const response = await fetch(SHOPEE_AFFILIATE_API_URL, {
      method: "POST",
      headers,
      body: payload,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Shopee API error response:", errorText)

      return NextResponse.json(
        {
          success: false,
          message: `Shopee API error: ${response.status} ${response.statusText}`,
          details: errorText,
        },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log("Shopee API response:", JSON.stringify(data).substring(0, 200) + "...")

    const products = data?.data?.productOfferV2?.nodes || []

    if (!products || products.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No products returned from Shopee API",
          apiResponse: data,
        },
        { status: 404 },
      )
    }

    // Calcular o preço original com base na taxa de desconto
    const processedProducts = products.map((product) => {
      const price = Number.parseFloat(product.price)
      const discountRate = Number.parseFloat(product.priceDiscountRate) / 100 // Convertendo para decimal

      // Se tiver taxa de desconto, calcular o preço original
      let originalPrice = null
      if (discountRate > 0) {
        // Fórmula: preço_atual = preço_original * (1 - taxa_desconto)
        // Portanto: preço_original = preço_atual / (1 - taxa_desconto)
        originalPrice = (price / (1 - discountRate)).toFixed(2)
      }

      return {
        ...product,
        calculatedOriginalPrice: originalPrice,
      }
    })

    // Cache the products
    try {
      await cacheProducts(processedProducts)
      console.log(`Cached ${processedProducts.length} products from Shopee API`)
    } catch (cacheError) {
      console.error("Error caching products from Shopee API:", cacheError)
    }

    return NextResponse.json({
      success: true,
      products: processedProducts,
      cached: true,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("Error fetching from Shopee API:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Failed to fetch from Shopee API: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
