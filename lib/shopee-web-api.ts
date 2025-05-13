import { createLogger } from "@/lib/logger"
import axios from "axios"

const logger = createLogger("shopee-web-api")

export interface ShopeeProductImages {
  productId: string
  shopId: string
  name: string
  images: string[]
  videos: string[]
  error?: string
}

export interface ShopeeProductInfo {
  itemId: string
  shopId: string
  name: string
  description: string
  price: number
  currency: string
  stock: number
  sold: number
  rating: number
  images: string[]
  videos: string[]
  attributes: { name: string; value: string }[]
  error?: string
}

/**
 * Serviço para acessar a API não oficial da Shopee (usada pelo frontend)
 */
export class ShopeeWebAPI {
  private static instance: ShopeeWebAPI

  private constructor() {
    logger.info("ShopeeWebAPI inicializado")
  }

  public static getInstance(): ShopeeWebAPI {
    if (!ShopeeWebAPI.instance) {
      ShopeeWebAPI.instance = new ShopeeWebAPI()
    }
    return ShopeeWebAPI.instance
  }

  /**
   * Extrai shopId e itemId de uma URL de produto da Shopee
   * @param url URL do produto
   * @returns Objeto com shopId e itemId, ou null se não for possível extrair
   */
  public extractIdsFromUrl(url: string): { shopId: string; itemId: string } | null {
    try {
      // Formato da URL: https://shopee.com.br/Product-Name-i.{shopId}.{itemId}
      const match = url.match(/i\.(\d+)\.(\d+)/)
      if (match && match.length === 3) {
        return {
          shopId: match[1],
          itemId: match[2],
        }
      }

      // Formato alternativo: https://shopee.com.br/product/{shopId}/{itemId}
      const altMatch = url.match(/\/product\/(\d+)\/(\d+)/)
      if (altMatch && altMatch.length === 3) {
        return {
          shopId: altMatch[1],
          itemId: altMatch[2],
        }
      }

      logger.warning(`Não foi possível extrair shopId e itemId da URL: ${url}`)
      return null
    } catch (error) {
      logger.error(`Erro ao extrair IDs da URL: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
      return null
    }
  }

  /**
   * Obtém todas as imagens de um produto usando a API não oficial da Shopee
   * @param shopId ID da loja
   * @param itemId ID do produto
   * @returns Array com URLs das imagens
   */
  public async getProductImages(shopId: string, itemId: string): Promise<ShopeeProductImages> {
    try {
      logger.info(`Buscando imagens do produto ${itemId} da loja ${shopId}`)

      const url = `https://shopee.com.br/api/v4/item/get?itemid=${itemId}&shopid=${shopId}`

      const response = await axios.get(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          Accept: "application/json",
          Referer: "https://shopee.com.br/",
        },
        timeout: 10000, // 10 segundos
      })

      if (response.status !== 200) {
        throw new Error(`API retornou status ${response.status}`)
      }

      const data = response.data.data
      if (!data) {
        throw new Error("Dados do produto não encontrados na resposta")
      }

      logger.info(`Dados do produto recebidos: ${JSON.stringify(data).substring(0, 200)}...`)

      // Extrair hashes das imagens
      const imageHashes = data.images || []
      if (!imageHashes.length) {
        logger.warning(`Nenhuma imagem encontrada para o produto ${itemId}`)
      } else {
        logger.info(`Encontradas ${imageHashes.length} imagens para o produto ${itemId}`)
      }

      // Construir URLs completas das imagens
      const imageUrls = imageHashes.map((hash: string) => `https://down-br.img.susercontent.com/file/${hash}`)

      // Extrair vídeos (se disponíveis)
      const videos: string[] = []
      if (data.video_info_list && data.video_info_list.length > 0) {
        data.video_info_list.forEach((videoInfo: any) => {
          if (videoInfo.default_format && videoInfo.default_format.url) {
            videos.push(videoInfo.default_format.url)
          }
        })
      }

      return {
        productId: itemId,
        shopId: shopId,
        name: data.name || `Produto ${itemId}`,
        images: imageUrls,
        videos: videos,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
      logger.error(`Erro ao obter imagens do produto ${itemId}: ${errorMessage}`)

      return {
        productId: itemId,
        shopId: shopId,
        name: `Produto ${itemId}`,
        images: [],
        videos: [],
        error: errorMessage,
      }
    }
  }

  /**
   * Obtém informações detalhadas de um produto usando a API não oficial da Shopee
   * @param shopId ID da loja
   * @param itemId ID do produto
   * @returns Informações detalhadas do produto
   */
  public async getProductInfo(shopId: string, itemId: string): Promise<ShopeeProductInfo> {
    try {
      logger.info(`Buscando informações do produto ${itemId} da loja ${shopId}`)

      const url = `https://shopee.com.br/api/v4/item/get?itemid=${itemId}&shopid=${shopId}`

      const response = await axios.get(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          Accept: "application/json",
          Referer: "https://shopee.com.br/",
        },
        timeout: 10000, // 10 segundos
      })

      if (response.status !== 200) {
        throw new Error(`API retornou status ${response.status}`)
      }

      const data = response.data.data
      if (!data) {
        throw new Error("Dados do produto não encontrados na resposta")
      }

      // Extrair hashes das imagens
      const imageHashes = data.images || []
      const imageUrls = imageHashes.map((hash: string) => `https://down-br.img.susercontent.com/file/${hash}`)

      // Extrair vídeos (se disponíveis)
      const videos: string[] = []
      if (data.video_info_list && data.video_info_list.length > 0) {
        data.video_info_list.forEach((videoInfo: any) => {
          if (videoInfo.default_format && videoInfo.default_format.url) {
            videos.push(videoInfo.default_format.url)
          }
        })
      }

      // Extrair atributos
      const attributes: { name: string; value: string }[] = []
      if (data.attributes && data.attributes.length > 0) {
        data.attributes.forEach((attr: any) => {
          if (attr.name && attr.value) {
            attributes.push({
              name: attr.name,
              value: attr.value,
            })
          }
        })
      }

      return {
        itemId: itemId,
        shopId: shopId,
        name: data.name || `Produto ${itemId}`,
        description: data.description || "",
        price: data.price / 100000 || 0, // Preço em centavos dividido por 100000
        currency: data.currency || "BRL",
        stock: data.stock || 0,
        sold: data.historical_sold || 0,
        rating: data.item_rating?.rating_star || 0,
        images: imageUrls,
        videos: videos,
        attributes: attributes,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
      logger.error(`Erro ao obter informações do produto ${itemId}: ${errorMessage}`)

      return {
        itemId: itemId,
        shopId: shopId,
        name: `Produto ${itemId}`,
        description: "",
        price: 0,
        currency: "BRL",
        stock: 0,
        sold: 0,
        rating: 0,
        images: [],
        videos: [],
        attributes: [],
        error: errorMessage,
      }
    }
  }

  /**
   * Extrai o shopId e itemId de um link de afiliado ou URL normal da Shopee
   * @param url URL do produto ou link de afiliado
   * @returns Objeto com shopId e itemId, ou null se não for possível extrair
   */
  public extractProductIds(url: string): { shopId: string; itemId: string } | null {
    try {
      // Tentar extrair de URL normal primeiro
      const normalUrlIds = this.extractIdsFromUrl(url)
      if (normalUrlIds) {
        return normalUrlIds
      }

      // Tentar extrair de link de afiliado
      // Formato: https://shope.ee/XXXXXX
      if (url.includes("shope.ee")) {
        // Para links de afiliado, precisamos seguir o redirecionamento
        // Isso requer uma solução mais complexa com fetch ou axios
        logger.warning("Links de afiliado shope.ee precisam ser expandidos primeiro")
        return null
      }

      logger.warning(`Não foi possível extrair shopId e itemId da URL: ${url}`)
      return null
    } catch (error) {
      logger.error(`Erro ao extrair IDs do produto: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
      return null
    }
  }
}

// Exportar instância singleton
export const shopeeWebAPI = ShopeeWebAPI.getInstance()
