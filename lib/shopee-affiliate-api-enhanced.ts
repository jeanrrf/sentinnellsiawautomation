import { createLogger } from "@/lib/logger"
import { getShopeeApiLogger } from "@/lib/advanced-logging/shopee-api-logger"
import crypto from "crypto"
import axios from "axios"

const logger = createLogger("shopee-affiliate-api")
const advancedLogger = getShopeeApiLogger()

export interface ShopeeAffiliateConfig {
  appId: string
  appSecret: string
  apiUrl: string
  affiliateId?: string
}

export interface ShopeeProductMedia {
  productId: string
  name: string
  images: string[]
  videos: string[]
  error?: string
}

export interface ShopeeProductDetail {
  itemId: string
  productName: string
  description: string
  price: string
  priceDiscountRate?: string
  sales?: string
  ratingStar?: string
  shopName?: string
  offerLink?: string
  imageUrl: string
  images?: string[]
  videos?: string[]
  attributes?: { name: string; value: string }[]
  categories?: string[]
  error?: string
}

/**
 * Classe para interagir com a API oficial de afiliados da Shopee
 * Versão aprimorada com sistema de logging avançado
 */
export class ShopeeAffiliateAPIEnhanced {
  private appId: string
  private appSecret: string
  private apiUrl: string
  private affiliateId?: string
  private readonly timeout: number = 15000 // 15 segundos de timeout

  constructor(config: ShopeeAffiliateConfig) {
    this.appId = config.appId
    this.appSecret = config.appSecret
    this.apiUrl = config.apiUrl
    this.affiliateId = config.affiliateId

    logger.info(
      `ShopeeAffiliateAPI inicializado com appId: ${this.appId}, apiUrl: ${this.apiUrl}, affiliateId: ${
        this.affiliateId || "não definido"
      }`,
    )
  }

  /**
   * Gera a assinatura para autenticação com a API da Shopee
   */
  private generateSignature(timestamp: number, payload: string): string {
    // Formato correto para a assinatura da Shopee
    const baseString = `${this.appId}${timestamp}${payload}${this.appSecret}`
    return crypto.createHash("sha256").update(baseString).digest("hex")
  }

  /**
   * Verifica se a API está configurada corretamente
   */
  private validateConfig(): boolean {
    if (!this.appId || !this.appSecret || !this.apiUrl) {
      const error = new Error("Configuração da API incompleta. Verifique as variáveis de ambiente.")
      advancedLogger.logValidationError(error, {
        context: {
          appIdExists: !!this.appId,
          appSecretExists: !!this.appSecret,
          apiUrlExists: !!this.apiUrl,
        },
      })
      return false
    }
    return true
  }

  /**
   * Faz uma requisição autenticada para a API da Shopee
   */
  private async makeAuthenticatedRequest(query: string, variables: any): Promise<any> {
    if (!this.validateConfig()) {
      throw new Error("Configuração da API incompleta. Verifique as variáveis de ambiente.")
    }

    try {
      const timestamp = Math.floor(Date.now() / 1000)
      const payload = JSON.stringify({ query, variables })
      const signature = this.generateSignature(timestamp, payload)

      logger.info(`Fazendo requisição para ${this.apiUrl}`)
      logger.info(`Query: ${query.substring(0, 100)}...`)
      logger.info(`Variables: ${JSON.stringify(variables)}`)

      // Formato exato do cabeçalho de autorização para a API da Shopee
      // Sem espaços após as vírgulas
      const authHeader = `SHA256 Credential=${this.appId},Timestamp=${timestamp},Signature=${signature}`

      logger.info(`Authorization Header: ${authHeader}`)

      const headers = {
        "Content-Type": "application/json",
        Authorization: authHeader,
      }

      // Adicionar timeout para evitar que a requisição fique pendente por muito tempo
      const response = await axios.post(this.apiUrl, payload, {
        headers,
        timeout: this.timeout,
        validateStatus: (status) => status >= 200 && status < 500, // Aceitar status 2xx e 4xx
      })

      // Verificar se a resposta é válida
      if (response.status !== 200) {
        const error = new Error(`API retornou status ${response.status}`)
        advancedLogger.logError(error, {
          context: {
            status: response.status,
            statusText: response.statusText,
            data: response.data,
            query: query.substring(0, 100),
            variables,
          },
        })
        throw error
      }

      // Verificar se a resposta contém erros
      if (response.data.errors) {
        const errorMessage = response.data.errors.map((e: any) => e.message).join(", ")
        const error = new Error(`Erro na API: ${errorMessage}`)
        advancedLogger.logError(error, {
          context: {
            errors: response.data.errors,
            query: query.substring(0, 100),
            variables,
          },
        })
        throw error
      }

      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === "ECONNABORTED") {
          const timeoutError = new Error(`Timeout na requisição após ${this.timeout}ms`)
          advancedLogger.logTimeoutError(timeoutError, {
            context: {
              timeout: this.timeout,
              query: query.substring(0, 100),
              variables,
            },
          })
          throw timeoutError
        }

        if (error.code === "ECONNREFUSED") {
          const connectionError = new Error(`Não foi possível conectar à API da Shopee. Verifique a URL.`)
          advancedLogger.logNetworkError(connectionError, {
            context: {
              url: this.apiUrl,
              error: error.message,
            },
          })
          throw connectionError
        }

        if (error.message.includes("Network Error")) {
          const networkError = new Error(`Erro de conexão com a API da Shopee. Verifique sua conexão de internet.`)
          advancedLogger.logNetworkError(networkError, {
            context: {
              url: this.apiUrl,
              error: error.message,
            },
          })
          throw networkError
        }

        // Check for authentication errors
        if (error.response?.status === 401 || error.response?.status === 403) {
          const authError = new Error(`Erro de autenticação: ${error.message}`)
          advancedLogger.logAuthError(authError, {
            context: {
              status: error.response.status,
              data: error.response.data,
            },
          })
          throw authError
        }

        const requestError = new Error(`Erro na requisição: ${error.message}`)
        advancedLogger.logError(requestError, {
          context: {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            query: query.substring(0, 100),
            variables,
          },
        })
        throw requestError
      }

      // For non-Axios errors
      advancedLogger.logError(error instanceof Error ? error : new Error(String(error)), {
        context: {
          query: query.substring(0, 100),
          variables,
        },
      })
      throw error
    }
  }

  /**
   * Busca detalhes de um produto pelo ID
   */
  public async getProductDetail(itemId: string): Promise<ShopeeProductDetail> {
    try {
      logger.info(`Buscando detalhes do produto ${itemId}`)

      // Consulta GraphQL para obter detalhes do produto
      const query = `
        query GetProductDetail($itemId: String!) {
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
      const data = await this.makeAuthenticatedRequest(query, variables)

      logger.info(`Resposta recebida: ${JSON.stringify(data).substring(0, 200)}...`)

      if (!data.data || !data.data.productDetailV2) {
        const error = new Error("Produto não encontrado ou resposta inválida")
        advancedLogger.logError(error, {
          context: {
            itemId,
            response: data,
          },
        })
        throw error
      }

      const productDetail = data.data.productDetailV2

      return {
        itemId: productDetail.itemId,
        productName: productDetail.productName,
        description: productDetail.description || "",
        price: productDetail.price,
        priceDiscountRate: productDetail.priceDiscountRate,
        sales: productDetail.sales,
        ratingStar: productDetail.ratingStar,
        shopName: productDetail.shopName,
        offerLink: productDetail.offerLink,
        imageUrl: productDetail.imageUrl || "/error-message.png",
        images: productDetail.images || [productDetail.imageUrl].filter(Boolean),
        videos: productDetail.videos || [],
        attributes: productDetail.attributes || [],
        categories: productDetail.categories || [],
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
      logger.error(`Erro ao buscar detalhes do produto ${itemId}: ${errorMessage}`)

      // We don't need to log here as it's already logged in makeAuthenticatedRequest
      throw new Error(`Erro ao buscar detalhes do produto: ${errorMessage}`)
    }
  }

  /**
   * Busca imagens e vídeos de um produto pelo ID
   */
  public async getProductMedia(itemId: string): Promise<ShopeeProductMedia> {
    try {
      logger.info(`Buscando mídia do produto ${itemId}`)

      // Consulta GraphQL para obter mídia do produto
      const query = `
        query GetProductMedia($itemId: String!) {
          productDetailV2(itemId: $itemId) {
            itemId
            productName
            imageUrl
            images
            videos
          }
        }
      `

      const variables = { itemId }
      const data = await this.makeAuthenticatedRequest(query, variables)

      logger.info(`Resposta recebida: ${JSON.stringify(data).substring(0, 200)}...`)

      if (!data.data || !data.data.productDetailV2) {
        const error = new Error("Produto não encontrado ou resposta inválida")
        advancedLogger.logError(error, {
          context: {
            itemId,
            response: data,
          },
        })
        throw error
      }

      const productDetail = data.data.productDetailV2

      // Verificar se há imagens disponíveis
      const images = productDetail.images || [productDetail.imageUrl].filter(Boolean)
      if (!images.length) {
        logger.warning(`Nenhuma imagem encontrada para o produto ${itemId}`)
      } else {
        logger.info(`Encontradas ${images.length} imagens para o produto ${itemId}`)
      }

      return {
        productId: itemId,
        name: productDetail.productName || `Produto ${itemId}`,
        images: images,
        videos: productDetail.videos || [],
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
      logger.error(`Erro ao buscar mídia do produto ${itemId}: ${errorMessage}`)

      // We don't need to log here as it's already logged in makeAuthenticatedRequest
      throw new Error(`Erro ao buscar mídia do produto: ${errorMessage}`)
    }
  }

  /**
   * Busca produtos com base em parâmetros de pesquisa
   */
  public async searchProducts(params: any): Promise<any[]> {
    try {
      logger.info(`Buscando produtos com parâmetros: ${JSON.stringify(params)}`)

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

      const data = await this.makeAuthenticatedRequest(query, variables)

      logger.info(`Resposta recebida: ${JSON.stringify(data).substring(0, 200)}...`)

      if (!data.data || !data.data.productOfferV2 || !data.data.productOfferV2.nodes) {
        logger.warning("Nenhum produto encontrado ou resposta inválida")
        return []
      }

      return data.data.productOfferV2.nodes
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
      logger.error(`Erro ao buscar produtos: ${errorMessage}`)

      // We don't need to log here as it's already logged in makeAuthenticatedRequest
      throw error
    }
  }

  /**
   * Busca produtos mais vendidos
   */
  public async getBestSellers(limit = 20): Promise<any[]> {
    try {
      logger.info(`Buscando produtos mais vendidos (limite: ${limit})`)

      // Consulta para produtos mais vendidos (ordenados por vendas)
      return await this.searchProducts({
        limit,
        sortType: 2, // 2 = ordenar por vendas
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
      logger.error(`Erro ao buscar produtos mais vendidos: ${errorMessage}`)

      // We don't need to log here as it's already logged in makeAuthenticatedRequest
      throw error
    }
  }
}

// Função para criar uma instância da API com as credenciais do ambiente
export function createShopeeAffiliateAPIEnhanced(): ShopeeAffiliateAPIEnhanced | null {
  const appId = process.env.SHOPEE_APP_ID
  const appSecret = process.env.SHOPEE_APP_SECRET
  const apiUrl = process.env.SHOPEE_AFFILIATE_API_URL
  const affiliateId = process.env.SHOPEE_AFFILIATE_ID

  if (!appId || !appSecret || !apiUrl) {
    const error = new Error("Credenciais da Shopee não encontradas nas variáveis de ambiente")
    advancedLogger.logValidationError(error, {
      context: {
        appIdExists: !!appId,
        appSecretExists: !!appSecret,
        apiUrlExists: !!apiUrl,
      },
    })
    return null
  }

  return new ShopeeAffiliateAPIEnhanced({
    appId,
    appSecret,
    apiUrl,
    affiliateId,
  })
}

// Instância singleton
let shopeeAffiliateAPIEnhancedInstance: ShopeeAffiliateAPIEnhanced | null = null

/**
 * Obtém a instância da API de afiliados da Shopee
 */
export function getShopeeAffiliateAPIEnhanced(): ShopeeAffiliateAPIEnhanced | null {
  if (!shopeeAffiliateAPIEnhancedInstance) {
    shopeeAffiliateAPIEnhancedInstance = createShopeeAffiliateAPIEnhanced()
  }

  return shopeeAffiliateAPIEnhancedInstance
}
