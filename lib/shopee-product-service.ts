import { createLogger } from "@/lib/logger"
import crypto from "crypto"

const logger = createLogger("shopee-product-service")

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

/**
 * Serviço para interagir com a API da Shopee
 */
export class ShopeeProductService {
  private appId: string
  private appSecret: string
  private apiUrl: string

  constructor(appId: string, appSecret: string, apiUrl: string) {
    this.appId = appId
    this.appSecret = appSecret
    this.apiUrl = apiUrl
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
  async getProductDetails(itemId: string): Promise<ShopeeProduct | null> {
    try {
      logger.info(`Buscando detalhes do produto: ${itemId}`)

      const timestamp = Math.floor(Date.now() / 1000)

      // Query GraphQL para obter detalhes completos do produto
      const query = `
        query GetProductDetails($itemId: String!) {
          productDetail(itemId: $itemId) {
            itemId
            productName
            price
            priceDiscountRate
            sales
            ratingStar
            shopName
            offerLink
            imageUrl
            description
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

      const headers = {
        Authorization: `SHA256 Credential=${this.appId}, Timestamp=${timestamp}, Signature=${signature}`,
        "Content-Type": "application/json",
      }

      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers,
        body: payload,
      })

      if (!response.ok) {
        const errorText = await response.text()
        logger.error(`Erro na API da Shopee: ${errorText}`)
        throw new Error(`Erro na API da Shopee: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      // Verificar se a resposta contém os dados do produto
      if (data?.data?.productDetail) {
        return data.data.productDetail
      }

      logger.warn(`Produto não encontrado: ${itemId}`)
      return null
    } catch (error: any) {
      logger.error(`Erro ao buscar detalhes do produto: ${error.message}`)
      return null
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
              description
              attributes {
                name
                value
              }
              categories
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

      const headers = {
        Authorization: `SHA256 Credential=${this.appId}, Timestamp=${timestamp}, Signature=${signature}`,
        "Content-Type": "application/json",
      }

      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers,
        body: payload,
      })

      if (!response.ok) {
        const errorText = await response.text()
        logger.error(`Erro na API da Shopee: ${errorText}`)
        throw new Error(`Erro na API da Shopee: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      // Verificar se a resposta contém produtos
      if (data?.data?.productOfferV2?.nodes) {
        return data.data.productOfferV2.nodes
      }

      logger.warn(`Nenhum produto encontrado para os parâmetros fornecidos`)
      return []
    } catch (error: any) {
      logger.error(`Erro ao buscar produtos: ${error.message}`)
      return []
    }
  }
}

// Instância singleton para uso em toda a aplicação
let shopeeServiceInstance: ShopeeProductService | null = null

/**
 * Obtém a instância singleton do serviço da Shopee
 */
export function getShopeeService(): ShopeeProductService | null {
  if (!shopeeServiceInstance) {
    const appId = process.env.SHOPEE_APP_ID
    const appSecret = process.env.SHOPEE_APP_SECRET
    const apiUrl = process.env.SHOPEE_AFFILIATE_API_URL

    if (!appId || !appSecret || !apiUrl) {
      logger.warn("Credenciais da API Shopee não configuradas")
      return null
    }

    shopeeServiceInstance = new ShopeeProductService(appId, appSecret, apiUrl)
  }

  return shopeeServiceInstance
}
