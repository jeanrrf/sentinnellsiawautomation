import { type NextRequest, NextResponse } from "next/server"
import { createHash } from "crypto-browserify"
import { createLogger, ErrorCodes } from "@/lib/logger"

const logger = createLogger("fetch-shopee-api")

// Shopee API credentials from environment variables
const SHOPEE_APP_ID = process.env.SHOPEE_APP_ID
const SHOPEE_APP_SECRET = process.env.SHOPEE_APP_SECRET
const SHOPEE_AFFILIATE_API_URL = process.env.SHOPEE_AFFILIATE_API_URL

// Função para gerar a assinatura para autenticação com a API da Shopee
function generateSignature(appId: string, timestamp: number, payload: string, secret: string) {
  const baseString = `${appId}${timestamp}${payload}${secret}`
  return createHash("sha256").update(baseString).digest("hex")
}

// Função para buscar produtos da API da Shopee
async function fetchShopeeProducts(params: any) {
  try {
    if (!SHOPEE_APP_ID || !SHOPEE_APP_SECRET || !SHOPEE_AFFILIATE_API_URL) {
      throw new Error("Credenciais da API Shopee não configuradas")
    }

    const timestamp = Math.floor(Date.now() / 1000)

    // Parâmetros padrão
    const defaultParams = {
      page: 1,
      limit: 20,
      sortType: 1, // 1: relevância, 2: vendas, 3: preço (baixo para alto), 4: preço (alto para baixo)
    }

    // Mesclar parâmetros padrão com os fornecidos
    const queryParams = { ...defaultParams, ...params }

    logger.info("Buscando produtos da Shopee com parâmetros:", queryParams)

    // Construir a query GraphQL para a API da Shopee
    let query = `
      query GetProducts($page: Int!, $limit: Int!, $sortType: Int) {
        productOfferV2(page: $page, limit: $limit, sortType: $sortType
    `

    // Adicionar parâmetros opcionais à query
    const optionalParams = []
    if (queryParams.keyword) optionalParams.push(`keyword: "${queryParams.keyword}"`)
    if (queryParams.category) optionalParams.push(`categoryId: ${queryParams.category}`)

    // Adicionar parâmetros opcionais à query se existirem
    if (optionalParams.length > 0) {
      query = query + ", " + optionalParams.join(", ")
    }

    // Completar a query
    query =
      query +
      `) {
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
      page: queryParams.page,
      limit: queryParams.limit,
      sortType: queryParams.sortType,
    }

    const payload = JSON.stringify({ query, variables })
    const signature = generateSignature(SHOPEE_APP_ID, timestamp, payload, SHOPEE_APP_SECRET)

    const headers = {
      Authorization: `SHA256 Credential=${SHOPEE_APP_ID}, Timestamp=${timestamp}, Signature=${signature}`,
      "Content-Type": "application/json",
    }

    logger.info("Fazendo requisição para a API da Shopee:", {
      url: SHOPEE_AFFILIATE_API_URL,
      timestamp,
      variables,
    })

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
      throw new Error(`Erro na API da Shopee: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    logger.info("Resposta da API da Shopee recebida", {
      dataPreview: JSON.stringify(data).substring(0, 200) + "...",
    })

    // Verificar se a resposta contém produtos
    const products = data?.data?.productOfferV2?.nodes || []

    if (!products || products.length === 0) {
      logger.warn("Nenhum produto retornado pela API da Shopee", { data })
      return {
        success: true,
        products: [],
        total: 0,
      }
    }

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

    // Aplicar filtros adicionais com base nos parâmetros
    let filteredProducts = [...processedProducts]

    // Filtrar por taxa de desconto mínima
    if (queryParams.minDiscountRate) {
      filteredProducts = filteredProducts.filter(
        (p) => Number.parseFloat(p.priceDiscountRate) >= queryParams.minDiscountRate,
      )
    }

    // Filtrar por avaliação mínima
    if (queryParams.minRating) {
      filteredProducts = filteredProducts.filter(
        (p) => p.ratingStar && Number.parseFloat(p.ratingStar) >= queryParams.minRating,
      )
    }

    // Filtrar por preço máximo
    if (queryParams.maxPrice) {
      filteredProducts = filteredProducts.filter((p) => p.price && Number.parseFloat(p.price) <= queryParams.maxPrice)
    }

    // Filtrar por preço mínimo
    if (queryParams.minPrice) {
      filteredProducts = filteredProducts.filter((p) => p.price && Number.parseFloat(p.price) >= queryParams.minPrice)
    }

    // Filtrar por vendas mínimas
    if (queryParams.minSales) {
      filteredProducts = filteredProducts.filter((p) => p.sales && Number.parseInt(p.sales) >= queryParams.minSales)
    }

    logger.info(`Produtos processados: ${processedProducts.length}, Após filtros: ${filteredProducts.length}`)

    return {
      success: true,
      products: filteredProducts,
      total: filteredProducts.length,
      rawTotal: processedProducts.length,
    }
  } catch (error: any) {
    logger.error("Erro ao buscar produtos da Shopee:", error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    let params
    try {
      params = await request.json()
      logger.info("Recebida solicitação para buscar produtos com parâmetros:", params)
    } catch (parseError) {
      logger.error("Erro ao analisar parâmetros da requisição:", parseError)
      params = {}
    }

    // Buscar dados diretamente da API da Shopee
    const result = await fetchShopeeProducts(params)

    return NextResponse.json({
      success: true,
      products: result.products,
      total: result.total,
      rawTotal: result.rawTotal,
      source: "api",
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    logger.error("Erro na rota fetch-shopee:", error, {
      code: ErrorCodes.API.REQUEST_FAILED,
      details: error.stack,
    })

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Erro ao buscar produtos",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    // Buscar dados diretamente da API da Shopee
    const result = await fetchShopeeProducts({
      page: 1,
      limit: 20,
      sortType: 2, // Ordenar por vendas por padrão
    })

    return NextResponse.json({
      success: true,
      products: result.products,
      total: result.total,
      source: "api",
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    logger.error("Erro ao processar solicitação GET:", error)

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Erro ao buscar produtos",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
