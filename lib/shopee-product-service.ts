import { createLogger } from "@/lib/logger"
import crypto from "crypto"

const logger = createLogger("shopee-product-service")

/**
 * Interface para o serviço da Shopee
 */
export interface ShopeeService {
  getProductDetails: (itemId: string) => Promise<any>
  searchProducts: (params: any) => Promise<ShopeeProduct[]>
  getProductMedia: (itemId: string) => Promise<ShopeeProductMedia>
}

// Tipos para os produtos da Shopee
export interface ShopeeProduct {
  itemId: string
  productName: string
  price: string
  priceDiscountRate?: string
  sales?: string
  ratingStar?: string
  shopName?: string
  offerLink?: string
  imageUrl: string
  description?: string
  attributes?: ShopeeProductAttribute[]
  categories?: string[]
  calculatedOriginalPrice?: string
}

export interface ShopeeProductAttribute {
  name: string
  value: string
}

export interface ShopeeProductMedia {
  id: string
  productId: string
  name: string
  images: string[]
  videos: string[]
  error?: string
}

/**
 * Serviço para interagir com a API da Shopee
 */
class ShopeeProductService implements ShopeeService {
  private appId: string
  private appSecret: string
  private apiUrl: string
  private affiliateId: string

  constructor(appId: string, appSecret: string, apiUrl: string, affiliateId: string) {
    this.appId = appId
    this.appSecret = appSecret
    this.apiUrl = apiUrl
    this.affiliateId = affiliateId

    logger.info(
      `Serviço Shopee inicializado com appId: ${appId}, apiUrl: ${apiUrl}, affiliateId: ${affiliateId || "não definido"}`,
    )
  }

  /**
   * Gera a assinatura para autenticação com a API da Shopee
   */
  private generateSignature(timestamp: number, payload: string): string {
    const baseString = `${this.appId}${timestamp}${payload}${this.appSecret}`
    return crypto.createHash("sha256").update(baseString).digest("hex")
  }

  /**
   * Busca detalhes completos de um produto pelo ID
   */
  async getProductDetails(itemId: string): Promise<any> {
    try {
      logger.info(`Buscando detalhes do produto ${itemId}`)

      const timestamp = Math.floor(Date.now() / 1000)

      // Construir a query GraphQL para detalhes do produto
      const query = `
        query GetProductDetails($itemId: String!) {
          productDetailV2(itemId: $itemId) {
            itemId
            productName
            description
            price
            priceDiscountRate
            sales
            ratingStar
            shopName
            offerLink
            imageUrl
            images
            videos
            attributes {
              name
              value
            }
            categories
          }
        }
      `

      const variables = { itemId }
      const payload = JSON.stringify({ query, variables })
      const signature = this.generateSignature(timestamp, payload)

      // Formato exato do cabeçalho de autorização para a API da Shopee
      const authHeader = `SHA256 Credential=${this.appId},Timestamp=${timestamp},Signature=${signature}`

      logger.info(`Authorization Header: ${authHeader}`)

      const headers = {
        "Content-Type": "application/json",
        Authorization: authHeader,
      }

      logger.info(`Fazendo requisição para ${this.apiUrl} com payload: ${payload.substring(0, 100)}...`)

      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers,
        body: payload,
      })

      logger.info(`Resposta da API: status ${response.status} ${response.statusText}`)

      if (!response.ok) {
        const errorText = await response.text()
        logger.error(`Erro na API da Shopee: ${errorText}`)
        throw new Error(`Erro na API da Shopee: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      logger.info(`Dados recebidos da API: ${JSON.stringify(data).substring(0, 200)}...`)

      // Verificar se a resposta contém os detalhes do produto
      if (data?.data?.productDetailV2) {
        return data.data.productDetailV2
      }

      logger.warning(`Nenhum detalhe encontrado para o produto ${itemId}`)
      return null
    } catch (error: any) {
      logger.error(`Erro ao obter detalhes do produto ${itemId}: ${error.message}`)
      return null
    }
  }

  /**
   * Busca mídia específica (imagens e vídeos) de um produto pelo ID
   * De acordo com a documentação da API Shopee Affiliate
   */
  async getProductMedia(itemId: string): Promise<ShopeeProductMedia> {
    try {
      logger.info(`Buscando mídia do produto ${itemId}`)

      const timestamp = Math.floor(Date.now() / 1000)

      // Construir a query GraphQL específica para mídia do produto
      // De acordo com a documentação da API Shopee Affiliate
      const query = `
        query GetProductMedia($itemId: String!) {
          productMediaV2(itemId: $itemId) {
            itemId
            productName
            imageUrl
            images
            videos
            shopName
          }
        }
      `

      const variables = { itemId }
      const payload = JSON.stringify({ query, variables })
      const signature = this.generateSignature(timestamp, payload)

      // Formato exato do cabeçalho de autorização para a API da Shopee
      const authHeader = `SHA256 Credential=${this.appId},Timestamp=${timestamp},Signature=${signature}`

      logger.info(`Authorization Header: ${authHeader}`)

      const headers = {
        "Content-Type": "application/json",
        Authorization: authHeader,
      }

      logger.info(`Fazendo requisição para ${this.apiUrl} com payload: ${payload.substring(0, 100)}...`)

      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers,
        body: payload,
      })

      logger.info(`Resposta da API: status ${response.status} ${response.statusText}`)

      if (!response.ok) {
        const errorText = await response.text()
        logger.error(`Erro na API da Shopee ao buscar mídia: ${errorText}`)
        throw new Error(`Erro na API da Shopee: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      logger.info(`Dados recebidos da API: ${JSON.stringify(data).substring(0, 200)}...`)

      // Verificar se a resposta contém a mídia do produto
      if (data?.data?.productMediaV2) {
        const mediaData = data.data.productMediaV2

        logger.info(
          `Mídia encontrada: imageUrl: ${!!mediaData.imageUrl}, images: ${JSON.stringify(mediaData.images)}, videos: ${JSON.stringify(mediaData.videos)}`,
        )

        // Formatar a resposta conforme esperado pela aplicação
        return {
          id: `media-${itemId}`,
          productId: itemId,
          name: mediaData.productName || `Produto ${itemId}`,
          images: Array.isArray(mediaData.images) ? mediaData.images : [mediaData.imageUrl].filter(Boolean),
          videos: Array.isArray(mediaData.videos) ? mediaData.videos : [],
        }
      }

      logger.warning(`Nenhuma mídia encontrada para o produto ${itemId}`)
      throw new Error(`Nenhuma mídia encontrada para o produto ${itemId}`)
    } catch (error: any) {
      logger.error(`Erro ao obter mídia do produto ${itemId}: ${error.message}`)

      // Retornar objeto com erro para tratamento adequado
      return {
        id: `media-${itemId}`,
        productId: itemId,
        name: `Produto ${itemId}`,
        images: [],
        videos: [],
        error: error.message,
      }
    }
  }

  /**
   * Busca produtos com base em parâmetros de pesquisa
   */
  async searchProducts(params: any): Promise<ShopeeProduct[]> {
    try {
      logger.info(`Buscando produtos com parâmetros:`, params)

      const timestamp = Math.floor(Date.now() / 1000)

      // Parâmetros padrão
      const defaultParams = {
        page: 1,
        limit: 20,
        sortType: 1, // 1: relevância, 2: vendas, 3: preço (baixo para alto), 4: preço (alto para baixo)
      }

      // Mesclar parâmetros padrão com os fornecidos
      const queryParams = { ...defaultParams, ...params }

      // Construir a query GraphQL
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

      const variables = {
        page: queryParams.page,
        limit: queryParams.limit,
        sortType: queryParams.sortType,
      }

      const payload = JSON.stringify({ query, variables })
      const signature = this.generateSignature(timestamp, payload)

      // Formato exato do cabeçalho de autorização para a API da Shopee
      const authHeader = `SHA256 Credential=${this.appId},Timestamp=${timestamp},Signature=${signature}`

      logger.info(`Authorization Header: ${authHeader}`)

      const headers = {
        "Content-Type": "application/json",
        Authorization: authHeader,
      }

      logger.info(`Fazendo requisição para ${this.apiUrl} com payload: ${payload.substring(0, 100)}...`)

      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers,
        body: payload,
      })

      logger.info(`Resposta da API: status ${response.status} ${response.statusText}`)

      if (!response.ok) {
        const errorText = await response.text()
        logger.error(`Erro na API da Shopee: ${errorText}`)
        throw new Error(`Erro na API da Shopee: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      logger.info(`Dados recebidos da API: ${JSON.stringify(data).substring(0, 200)}...`)

      // Verificar se a resposta contém produtos
      if (data?.data?.productOfferV2?.nodes) {
        return data.data.productOfferV2.nodes
      }

      logger.warning(`Nenhum produto encontrado para os parâmetros fornecidos`)
      return []
    } catch (error: any) {
      logger.error(`Erro ao buscar produtos: ${error.message}`)
      return []
    }
  }
}

// Instância singleton
let shopeeServiceInstance: ShopeeService | null = null

/**
 * Obtém a instância do serviço da Shopee
 */
export function getShopeeService(): ShopeeService | null {
  if (!shopeeServiceInstance) {
    const appId = process.env.SHOPEE_APP_ID
    const appSecret = process.env.SHOPEE_APP_SECRET
    const apiUrl = process.env.SHOPEE_AFFILIATE_API_URL
    const affiliateId = process.env.SHOPEE_AFFILIATE_ID

    if (!appId || !appSecret || !apiUrl) {
      logger.warning("Credenciais da Shopee não encontradas")
      return null
    }

    shopeeServiceInstance = new ShopeeProductService(appId, appSecret, apiUrl, affiliateId || "")
  }

  return shopeeServiceInstance
}
