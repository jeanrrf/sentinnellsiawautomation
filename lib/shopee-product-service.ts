import { createLogger } from "@/lib/logger"
import crypto from "crypto"

const logger = createLogger("shopee-product-service")

/**
 * Interface para o serviço da Shopee
 */
export interface ShopeeService {
  getProductDetails: (itemId: string) => Promise<any>
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

/**
 * Serviço para interagir com a API da Shopee
 */
class ShopeeProductService implements ShopeeService {
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
  async getProductDetails(itemId: string): Promise<any> {
    try {
      // Implementação simplificada - em um cenário real, faria uma chamada à API da Shopee
      logger.info(`Buscando detalhes do produto ${itemId}`)

      // Simular uma chamada à API
      // Em um cenário real, usaríamos a API da Shopee para obter os detalhes completos
      return {
        itemId,
        description:
          "Este é um produto de alta qualidade com diversas funcionalidades. Perfeito para uso diário e com garantia de durabilidade. Fabricado com materiais premium e tecnologia avançada.",
        attributes: [
          { name: "Material", value: "Premium" },
          { name: "Cor", value: "Preto" },
          { name: "Garantia", value: "12 meses" },
        ],
      }
    } catch (error: any) {
      logger.error(`Erro ao obter detalhes do produto ${itemId}: ${error.message}`)
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

    if (!appId || !appSecret || !apiUrl) {
      logger.warn("Credenciais da Shopee não encontradas")
      return null
    }

    shopeeServiceInstance = new ShopeeProductService(appId, appSecret, apiUrl)
  }

  return shopeeServiceInstance
}
