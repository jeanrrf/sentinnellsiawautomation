import { NextResponse } from "next/server"
import { createLogger, ErrorCodes } from "@/lib/logger"
import crypto from "crypto"

const logger = createLogger("api-best-sellers")

// Shopee API credentials from environment variables
const SHOPEE_APP_ID = process.env.SHOPEE_APP_ID
const SHOPEE_APP_SECRET = process.env.SHOPEE_APP_SECRET
const SHOPEE_AFFILIATE_API_URL = process.env.SHOPEE_AFFILIATE_API_URL

// Function to generate signature for Shopee API authentication
function generateSignature(appId: string, timestamp: number, payload: string, secret: string) {
  const baseString = `${appId}${timestamp}${payload}${secret}`
  return crypto.createHash("sha256").update(baseString).digest("hex")
}

export async function GET() {
  try {
    logger.info("Fetching best seller products")

    if (!SHOPEE_APP_ID || !SHOPEE_APP_SECRET || !SHOPEE_AFFILIATE_API_URL) {
      throw new Error("Shopee API credentials not configured")
    }

    const timestamp = Math.floor(Date.now() / 1000)

    // Build GraphQL query for Shopee API
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

    // Variables for GraphQL query - sort by sales (2) to get best sellers
    const variables = {
      page: 1,
      limit: 10,
      sortType: 2, // Sort by sales
    }

    const payload = JSON.stringify({ query, variables })
    const signature = generateSignature(SHOPEE_APP_ID, timestamp, payload, SHOPEE_APP_SECRET)

    const headers = {
      Authorization: `SHA256 Credential=${SHOPEE_APP_ID},Timestamp=${timestamp},Signature=${signature}`,
      "Content-Type": "application/json",
    }

    logger.info("Making request to Shopee API")

    // Make the actual request to Shopee API
    const response = await fetch(SHOPEE_AFFILIATE_API_URL, {
      method: "POST",
      headers,
      body: payload,
    })

    if (!response.ok) {
      const errorText = await response.text()
      logger.error("Error in Shopee API response:", {
        status: response.status,
        statusText: response.statusText,
        errorText,
      })
      throw new Error(`Shopee API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    logger.info("Shopee API response received")

    // Check if the response contains products
    const products = data?.data?.productOfferV2?.nodes || []

    if (products.length === 0) {
      logger.warning("No products returned from Shopee API")
      throw new Error("No products found")
    }

    logger.info(`Retrieved ${products.length} best seller products from Shopee API`)

    // Process the returned products
    const processedProducts = products.map((product: any) => {
      const price = Number.parseFloat(product.price)
      const discountRate = Number.parseFloat(product.priceDiscountRate || "0") / 100 // Convert to decimal

      // If there's a discount rate, calculate the original price
      let originalPrice = null
      if (discountRate > 0) {
        // Formula: current_price = original_price * (1 - discount_rate)
        // Therefore: original_price = current_price / (1 - discount_rate)
        originalPrice = (price / (1 - discountRate)).toFixed(2)
      }

      return {
        ...product,
        calculatedOriginalPrice: originalPrice,
      }
    })

    return NextResponse.json({
      success: true,
      products: processedProducts,
      total: processedProducts.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    logger.error("Error fetching best seller products:", {
      code: ErrorCodes.API.REQUEST_FAILED,
      details: error,
    })

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error fetching products",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
