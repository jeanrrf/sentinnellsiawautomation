import { type NextRequest, NextResponse } from "next/server"
import { createLogger, ErrorCodes } from "@/lib/logger"
import crypto from "crypto"

const logger = createLogger("api-product-details")

// Shopee API credentials from environment variables
const SHOPEE_APP_ID = process.env.SHOPEE_APP_ID
const SHOPEE_APP_SECRET = process.env.SHOPEE_APP_SECRET
const SHOPEE_AFFILIATE_API_URL = process.env.SHOPEE_AFFILIATE_API_URL

// Function to generate signature for Shopee API authentication
function generateSignature(appId: string, timestamp: number, payload: string, secret: string) {
  const baseString = `${appId}${timestamp}${payload}${secret}`
  return crypto.createHash("sha256").update(baseString).digest("hex")
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const itemId = searchParams.get("itemId")

    if (!itemId) {
      return NextResponse.json(
        {
          success: false,
          error: "Item ID é obrigatório",
        },
        { status: 400 },
      )
    }

    logger.info(`Buscando detalhes do produto: ${itemId}`)

    if (!SHOPEE_APP_ID || !SHOPEE_APP_SECRET || !SHOPEE_AFFILIATE_API_URL) {
      throw new Error("Shopee API credentials not configured")
    }

    const timestamp = Math.floor(Date.now() / 1000)

    // Build GraphQL query for Shopee API to get product details
    const query = `
      query GetProductDetails($itemId: String!) {
        productOfferV2Detail(itemId: $itemId) {
          itemId
          productName
          description
          price
          priceMin
          priceMax
          priceDiscountRate
          imageUrl
          images
          shopName
          shopId
          ratingStar
          ratingCount
          sales
          stock
          attributes {
            name
            value
          }
          categories {
            name
            id
          }
        }
      }
    `

    const variables = {
      itemId: itemId,
    }

    const payload = JSON.stringify({ query, variables })
    const signature = generateSignature(SHOPEE_APP_ID, timestamp, payload, SHOPEE_APP_SECRET)

    const headers = {
      Authorization: `SHA256 Credential=${SHOPEE_APP_ID}, Timestamp=${timestamp}, Signature=${signature}`,
      "Content-Type": "application/json",
    }

    logger.info("Fazendo requisição para a API da Shopee")

    // Make the actual request to Shopee API
    const response = await fetch(SHOPEE_AFFILIATE_API_URL, {
      method: "POST",
      headers,
      body: payload,
    })

    if (!response.ok) {
      const errorText = await response.text()
      logger.error("Erro na resposta da API da Shopee:", {
        code: ErrorCodes.API.RESPONSE_INVALID,
        details: {
          status: response.status,
          statusText: response.statusText,
          errorText,
        },
      })
      throw new Error(`Shopee API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    logger.info("Resposta da API da Shopee recebida")

    // Check if the response contains product details
    const product = data?.data?.productOfferV2Detail

    if (!product) {
      logger.warn("Nenhum detalhe de produto retornado da API da Shopee")
      throw new Error("Produto não encontrado")
    }

    // Process the product details
    // Ensure images is an array
    const images = Array.isArray(product.images) ? product.images : []

    // If no additional images, at least include the main image
    if (images.length === 0 && product.imageUrl) {
      images.push(product.imageUrl)
    }

    // Create enhanced product object
    const enhancedProduct = {
      ...product,
      images: images,
    }

    logger.info(`Detalhes do produto recuperados com sucesso. ID: ${itemId}, Imagens: ${images.length}`)

    return NextResponse.json({
      success: true,
      product: enhancedProduct,
    })
  } catch (error: any) {
    logger.error("Erro ao buscar detalhes do produto:", {
      code: ErrorCodes.API.REQUEST_FAILED,
      details: error,
    })

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Falha ao buscar detalhes do produto",
      },
      { status: 500 },
    )
  }
}
