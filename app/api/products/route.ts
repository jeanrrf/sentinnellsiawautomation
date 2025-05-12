import { NextResponse } from "next/server"
import { createLogger, ErrorCodes } from "@/lib/logger"
import crypto from "crypto"
import storageService from "@/lib/storage-service"

const logger = createLogger("api-products")

// Shopee API credentials from environment variables
const SHOPEE_APP_ID = process.env.SHOPEE_APP_ID
const SHOPEE_APP_SECRET = process.env.SHOPEE_APP_SECRET
const SHOPEE_AFFILIATE_API_URL = process.env.SHOPEE_AFFILIATE_API_URL

// Função para gerar a assinatura para autenticação com a API da Shopee
function generateSignature(appId: string, timestamp: number, payload: string, secret: string) {
  const baseString = `${appId}${timestamp}${payload}${secret}`
  return crypto.createHash("sha256").update(baseString).digest("hex")
}

export async function GET(request: Request) {
  try {
    logger.info("Recebida solicitação para buscar produtos")

    // Verificar se temos produtos armazenados temporariamente
    const cachedProducts = await storageService.getProducts()
    if (cachedProducts && cachedProducts.length > 0) {
      logger.info(`Retornando ${cachedProducts.length} produtos do armazenamento temporário`)
      return NextResponse.json({
        success: true,
        products: cachedProducts,
        total: cachedProducts.length,
        source: "temporary-storage",
        timestamp: new Date().toISOString(),
      })
    }

    if (!SHOPEE_APP_ID || !SHOPEE_APP_SECRET || !SHOPEE_AFFILIATE_API_URL) {
      const errorMessage = "Credenciais da API Shopee não configuradas"
      logger.error(errorMessage)
      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          message: "AVISO: As credenciais da API Shopee não estão configuradas. Verifique as variáveis de ambiente.",
        },
        { status: 500 },
      )
    }

    const timestamp = Math.floor(Date.now() / 1000)

    // Construir a query GraphQL para a API da Shopee
    const query = `
      query GetProducts($page: Int!, $limit: Int!, $sortType: Int) {
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

    // Variáveis para a query GraphQL
    const variables = {
      page: 1,
      limit: 20,
      sortType: 2, // Ordenar por vendas por padrão
    }

    const payload = JSON.stringify({ query, variables })
    const signature = generateSignature(SHOPEE_APP_ID, timestamp, payload, SHOPEE_APP_SECRET)

    const headers = {
      Authorization: `SHA256 Credential=${SHOPEE_APP_ID}, Timestamp=${timestamp}, Signature=${signature}`,
      "Content-Type": "application/json",
    }

    logger.info("Fazendo requisição para a API da Shopee")

    // Fazer a requisição real à API da Shopee
    const response = await fetch(SHOPEE_AFFILIATE_API_URL, {
      method: "POST",
      headers,
      body: payload,
    })

    if (!response.ok) {
      const errorText = await response.text()
      logger.error("Erro na resposta da API da Shopee:", {
        status: response.status,
        statusText: response.statusText,
        errorText,
      })

      return NextResponse.json(
        {
          success: false,
          error: `Erro na API da Shopee: ${response.status} ${response.statusText}`,
          message:
            "AVISO: Não foi possível obter dados da API Shopee. Por favor, tente novamente mais tarde ou verifique a conexão com a API.",
        },
        { status: response.status },
      )
    }

    const data = await response.json()
    logger.info("Resposta da API da Shopee recebida")

    // Verificar se a resposta contém produtos
    const products = data?.data?.productOfferV2?.nodes || []

    if (!products || products.length === 0) {
      logger.warn("Nenhum produto retornado pela API da Shopee")
      return NextResponse.json(
        {
          success: false,
          error: "Nenhum produto encontrado",
          message: "AVISO: A API da Shopee não retornou nenhum produto. Tente modificar os parâmetros de busca.",
        },
        { status: 404 },
      )
    }

    logger.info(`Obtidos ${products.length} produtos da API da Shopee`)

    // Processar os produtos retornados
    const processedProducts = products.map((product: any) => {
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

    // Salvar produtos no armazenamento temporário
    await storageService.saveProducts(processedProducts)

    return NextResponse.json({
      success: true,
      products: processedProducts,
      total: processedProducts.length,
      source: "api",
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    logger.error("Erro ao buscar produtos:", {
      code: ErrorCodes.API.REQUEST_FAILED,
      details: error,
    })

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erro desconhecido ao buscar produtos",
        message: "AVISO: Ocorreu um erro ao buscar produtos da API Shopee. Por favor, tente novamente mais tarde.",
      },
      { status: 500 },
    )
  }
}
