import { NextResponse } from "next/server"
import crypto from "crypto"

// Shopee API credentials from environment variables
const SHOPEE_APP_ID = process.env.SHOPEE_APP_ID
const SHOPEE_APP_SECRET = process.env.SHOPEE_APP_SECRET
const SHOPEE_AFFILIATE_API_URL = process.env.SHOPEE_AFFILIATE_API_URL

function generateSignature(appId: string, timestamp: number, payload: string, secret: string) {
  const baseString = `${appId}${timestamp}${payload}${secret}`
  return crypto.createHash("sha256").update(baseString).digest("hex")
}

export async function GET() {
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

    // Simplified query to get all fields
    const query = `
      query GetBestSellers($page: Int!, $limit: Int!, $sortType: Int) {
        productOfferV2(page: $page, limit: $limit, sortType: $sortType) {
          nodes {
            __typename
            ... on ProductOfferV2 {
              # Request just one product with all fields to analyze the structure
              itemId
              productName
              price
            }
          }
        }
      }
    `

    const variables = { page: 1, limit: 1, sortType: 2 }
    const payload = JSON.stringify({ query, variables })

    const signature = generateSignature(SHOPEE_APP_ID, timestamp, payload, SHOPEE_APP_SECRET)

    const headers = {
      Authorization: `SHA256 Credential=${SHOPEE_APP_ID}, Timestamp=${timestamp}, Signature=${signature}`,
      "Content-Type": "application/json",
    }

    console.log("Fetching from Shopee API with URL:", SHOPEE_AFFILIATE_API_URL)

    // First, let's try to get the schema information
    const introspectionQuery = `
      {
        __schema {
          types {
            name
            kind
            fields {
              name
              type {
                name
                kind
              }
            }
          }
        }
      }
    `

    const introspectionPayload = JSON.stringify({ query: introspectionQuery })
    const introspectionSignature = generateSignature(SHOPEE_APP_ID, timestamp, introspectionPayload, SHOPEE_APP_SECRET)

    const introspectionHeaders = {
      Authorization: `SHA256 Credential=${SHOPEE_APP_ID}, Timestamp=${timestamp}, Signature=${introspectionSignature}`,
      "Content-Type": "application/json",
    }

    let schemaInfo = null
    try {
      const schemaResponse = await fetch(SHOPEE_AFFILIATE_API_URL, {
        method: "POST",
        headers: introspectionHeaders,
        body: introspectionPayload,
      })

      if (schemaResponse.ok) {
        schemaInfo = await schemaResponse.json()
      }
    } catch (e) {
      console.error("Failed to fetch schema:", e)
    }

    // Now fetch a sample product
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

    // Now let's try a more complete query to see all available fields
    const completeQuery = `
      query GetBestSellers($page: Int!, $limit: Int!, $sortType: Int) {
        productOfferV2(page: $page, limit: $limit, sortType: $sortType) {
          nodes {
            itemId
            productName
            price
            commissionRate
            discount
            description
            sales
            imageUrl
            shopName
            offerLink
            ratingStar
            # Try to get all possible price-related fields
            listPrice
            retailPrice
            basePrice
            beforePrice
            compareAtPrice
            originalPrice
            priceBeforeDiscount
            priceMax
            priceMin
          }
        }
      }
    `

    const completePayload = JSON.stringify({ query: completeQuery, variables })
    const completeSignature = generateSignature(SHOPEE_APP_ID, timestamp, completePayload, SHOPEE_APP_SECRET)

    const completeHeaders = {
      Authorization: `SHA256 Credential=${SHOPEE_APP_ID}, Timestamp=${timestamp}, Signature=${completeSignature}`,
      "Content-Type": "application/json",
    }

    const completeResponse = await fetch(SHOPEE_AFFILIATE_API_URL, {
      method: "POST",
      headers: completeHeaders,
      body: completePayload,
    })

    let completeData = null
    let completeError = null

    if (completeResponse.ok) {
      completeData = await completeResponse.json()
    } else {
      completeError = await completeResponse.text()
    }

    // Return all the information we gathered
    return NextResponse.json({
      success: true,
      initialResponse: data,
      schemaInfo,
      completeQuery: {
        data: completeData,
        error: completeError,
      },
      // Extract the first product to analyze its structure
      sampleProduct: data?.data?.productOfferV2?.nodes?.[0] || null,
      // List all fields available in the sample product
      availableFields: data?.data?.productOfferV2?.nodes?.[0] ? Object.keys(data.data.productOfferV2.nodes[0]) : [],
    })
  } catch (error: any) {
    console.error("Error analyzing Shopee API:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Failed to analyze Shopee API: ${error.message}`,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
