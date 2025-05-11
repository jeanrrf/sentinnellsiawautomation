import { Redis } from "@upstash/redis"
import { createLogger } from "./logger"

const logger = createLogger("Redis")

export const CACHE_KEYS = {
  PRODUCTS: "shopee:products",
  PRODUCT_PREFIX: "shopee:product:", // Adicionando prefixo para produtos individuais
  DESCRIPTION_PREFIX: "shopee:description:",
  PROCESSED_IDS: "shopee:processed_ids",
  CARDS: "shopee:cards",
  CARD_PREFIX: "shopee:card:",
  PUBLISHED_CARDS: "shopee:published_cards",
  EXCLUDED_PRODUCTS: "shopee:excluded_products", // Produtos que não devem ser buscados novamente
}

// Cache TTLs in seconds
export const CACHE_TTL = {
  PRODUCTS: 60 * 60, // 1 hour
  DESCRIPTIONS: 60 * 60 * 24, // 24 hours
  PROCESSED_IDS: 60 * 60 * 24 * 7, // 7 days
  PUBLISHED_CARDS: 60 * 60 * 24 * 30, // 30 days
  EXCLUDED_PRODUCTS: 60 * 60 * 24 * 90, // 90 days (produtos que não devem ser buscados novamente)
  CARDS: 60 * 60 * 24 * 30, // 30 days for cards
}

// Variável para armazenar a instância do cliente Redis
let redisClient: Redis | null = null

// Função para criar e retornar o cliente Redis
export function getRedisClient() {
  try {
    // Se já temos uma instância, retorná-la
    if (redisClient) {
      return redisClient
    }

    // Verificar se as variáveis de ambiente necessárias estão definidas
    const url = process.env.KV_REST_API_URL || process.env.KV_URL || process.env.REDIS_URL
    const token = process.env.KV_REST_API_TOKEN || process.env.KV_REST_API_READ_ONLY_TOKEN

    if (!url || !token) {
      logger.error("Variáveis de ambiente Redis não configuradas", {
        hasUrl: !!url,
        hasToken: !!token,
      })
      return null
    }

    // Criar cliente Redis usando variáveis de ambiente
    redisClient = new Redis({
      url,
      token,
      retry: {
        retries: 3,
        factor: 2,
        minTimeout: 1000,
        maxTimeout: 3000,
      },
    })

    logger.info("Cliente Redis inicializado com sucesso")
    return redisClient
  } catch (error) {
    logger.error("Erro ao criar cliente Redis:", error)
    redisClient = null
    return null
  }
}

// Função para verificar se o Redis está disponível
export async function isRedisAvailable(): Promise<boolean> {
  try {
    const redis = getRedisClient()
    if (!redis) return false

    // Tentar uma operação simples para verificar a conexão
    const testKey = `redis-test-${Date.now()}`
    await redis.set(testKey, "test", { ex: 10 })
    const result = await redis.get(testKey)
    return result === "test"
  } catch (error) {
    logger.error("Erro ao verificar disponibilidade do Redis:", error)
    return false
  }
}

// Função para obter produtos em cache
export async function getCachedProducts() {
  try {
    const redis = getRedisClient()
    if (!redis) {
      logger.warning("Cliente Redis não disponível ao obter produtos")
      return []
    }

    const products = await redis.get(CACHE_KEYS.PRODUCTS)

    // Se products for uma string, tente fazer o parse para JSON
    if (typeof products === "string") {
      try {
        return JSON.parse(products)
      } catch (parseError) {
        logger.error("Erro ao fazer parse dos produtos em cache:", parseError)
        return []
      }
    }

    return products || []
  } catch (error) {
    logger.error("Error getting cached products:", error)
    return []
  }
}

// Função para obter um produto específico do cache
export async function getCachedProduct(productId: string) {
  try {
    const redis = getRedisClient()
    if (!redis) {
      logger.warning(`Cliente Redis não disponível ao obter produto ${productId}`)
      return null
    }

    // Primeiro, tente obter o produto diretamente pela chave individual
    const product = await redis.get(`${CACHE_KEYS.PRODUCT_PREFIX}${productId}`)

    if (product) {
      // Se for uma string, tente fazer o parse
      if (typeof product === "string") {
        try {
          return JSON.parse(product)
        } catch (parseError) {
          logger.error(`Erro ao fazer parse do produto ${productId}:`, parseError)
        }
      } else {
        return product
      }
    }

    // Se não encontrar, tente buscar na lista completa
    const products = await getCachedProducts()
    if (!Array.isArray(products)) {
      logger.warn("Produtos em cache não é um array:", typeof products)
      return null
    }

    return products.find((p: any) => p.itemId === productId) || null
  } catch (error) {
    logger.error(`Error getting cached product ${productId}:`, error)
    return null
  }
}

// Função para obter descrição em cache
export async function getCachedDescription(productId: string) {
  try {
    const redis = getRedisClient()
    if (!redis) {
      logger.warning(`Cliente Redis não disponível ao obter descrição para produto ${productId}`)
      return null
    }

    const key = `${CACHE_KEYS.DESCRIPTION_PREFIX}${productId}`
    const description = await redis.get(key)
    return description || null
  } catch (error) {
    logger.error(`Error getting cached description for product ${productId}:`, error)
    return null
  }
}

// Função para salvar descrição no cache
export async function cacheDescription(productId: string, description: string): Promise<void> {
  try {
    const redis = getRedisClient()
    if (!redis) {
      logger.warning(`Cliente Redis não disponível ao salvar descrição para produto ${productId}`)
      return
    }

    await redis.set(`${CACHE_KEYS.DESCRIPTION_PREFIX}${productId}`, description, { ex: CACHE_TTL.DESCRIPTIONS })
  } catch (error) {
    logger.error(`Error caching description for product ${productId}:`, error)
  }
}

// Função para limpar o cache
export async function clearCache() {
  try {
    const redis = getRedisClient()
    if (!redis) {
      logger.warning("Cliente Redis não disponível ao limpar cache")
      return false
    }

    // Obter todas as chaves
    const keys = await redis.keys("shopee:*")

    // Excluir cada chave
    for (const key of keys) {
      await redis.del(key)
    }

    logger.info("Cache cleared successfully")
    return true
  } catch (error) {
    logger.error("Error clearing cache:", error)
    return false
  }
}

// Adicionando as funções que estavam faltando
export async function createCacheEntry(key: string, value: any, ttl?: number): Promise<void> {
  try {
    const redis = getRedisClient()
    if (!redis) {
      logger.warning(`Cliente Redis não disponível ao criar entrada de cache para chave ${key}`)
      return
    }

    // Garantir que estamos armazenando uma string
    const valueToStore = typeof value === "string" ? value : JSON.stringify(value)

    if (ttl) {
      await redis.set(key, valueToStore, { ex: ttl })
    } else {
      await redis.set(key, valueToStore)
    }
    logger.debug(`Cache entry created for key: ${key}`)
  } catch (error) {
    logger.error(`Error creating cache entry for key ${key}:`, error)
  }
}

export async function getCacheEntry(key: string): Promise<any | null> {
  try {
    const redis = getRedisClient()
    if (!redis) {
      logger.warning(`Cliente Redis não disponível ao obter entrada de cache para chave ${key}`)
      return null
    }

    const cachedData = await redis.get(key)

    if (!cachedData) return null

    // Handle the case where the data might already be an object
    if (typeof cachedData === "object" && !Array.isArray(cachedData) && cachedData !== null) {
      logger.debug("Cached data is already an object, returning directly")
      return cachedData
    }

    // If it's a string, parse it
    if (typeof cachedData === "string") {
      try {
        return JSON.parse(cachedData)
      } catch (parseError) {
        logger.error("Error parsing cached data:", parseError)
        return cachedData // Retornar o valor bruto se não for possível fazer o parse
      }
    }

    logger.error("Unexpected cached data format:", typeof cachedData)
    return cachedData // Retornar o valor como está
  } catch (error) {
    logger.error("Error getting cached data:", error)
    return null
  }
}

export async function cacheProducts(products: any[]): Promise<void> {
  try {
    const redis = getRedisClient()
    if (!redis) {
      logger.warning("Cliente Redis não disponível ao cachear produtos")
      return
    }

    if (!Array.isArray(products)) {
      logger.error("Produtos não é um array:", typeof products)
      return
    }

    // Verificar produtos excluídos antes de cachear
    const excludedProducts = await getExcludedProducts()

    // Filtrar produtos que não estão na lista de excluídos
    const filteredProducts = products.filter((product) => !excludedProducts.includes(product.itemId))

    // Make sure we're storing a string in Redis
    const productsString = JSON.stringify(filteredProducts)

    // Cache the full product list
    await redis.set(CACHE_KEYS.PRODUCTS, productsString, { ex: CACHE_TTL.PRODUCTS })

    // Also cache individual products for faster access
    for (const product of filteredProducts) {
      await redis.set(`${CACHE_KEYS.PRODUCT_PREFIX}${product.itemId}`, JSON.stringify(product), {
        ex: CACHE_TTL.PRODUCTS,
      })
    }

    logger.info(`Cached ${filteredProducts.length} products for ${CACHE_TTL.PRODUCTS} seconds`)
  } catch (error) {
    logger.error("Error caching products:", error)
    // Continue execution even if caching fails
  }
}

export async function addProcessedId(productId: string): Promise<void> {
  try {
    const redis = getRedisClient()
    if (!redis) {
      logger.warning(`Cliente Redis não disponível ao adicionar ID processado ${productId}`)
      return
    }

    await redis.sadd(CACHE_KEYS.PROCESSED_IDS, productId)
    // Set expiration if the set is newly created
    const ttl = await redis.ttl(CACHE_KEYS.PROCESSED_IDS)
    if (ttl < 0) {
      await redis.expire(CACHE_KEYS.PROCESSED_IDS, CACHE_TTL.PROCESSED_IDS)
    }
  } catch (error) {
    logger.error(`Error adding processed ID ${productId}:`, error)
  }
}

export async function isIdProcessed(productId: string): Promise<boolean> {
  try {
    const redis = getRedisClient()
    if (!redis) {
      logger.warning(`Cliente Redis não disponível ao verificar se ID ${productId} foi processado`)
      return false
    }

    return (await redis.sismember(CACHE_KEYS.PROCESSED_IDS, productId)) === 1
  } catch (error) {
    logger.error(`Error checking if ID ${productId} is processed:`, error)
    return false
  }
}

/**
 * Adiciona um produto à lista de excluídos
 * Produtos excluídos não serão mais buscados na API ou exibidos nas listas
 */
export async function addExcludedProduct(productId: string): Promise<void> {
  try {
    const redis = getRedisClient()
    if (!redis) {
      logger.warning(`Cliente Redis não disponível ao adicionar produto ${productId} à lista de excluídos`)
      return
    }

    await redis.sadd(CACHE_KEYS.EXCLUDED_PRODUCTS, productId)

    // Definir TTL se o conjunto for recém-criado
    const ttl = await redis.ttl(CACHE_KEYS.EXCLUDED_PRODUCTS)
    if (ttl < 0) {
      await redis.expire(CACHE_KEYS.EXCLUDED_PRODUCTS, CACHE_TTL.EXCLUDED_PRODUCTS)
    }

    // Remover o produto do cache de produtos
    await redis.del(`${CACHE_KEYS.PRODUCT_PREFIX}${productId}`)

    // Remover o produto da lista de produtos
    const products = await getCachedProducts()
    if (products && Array.isArray(products)) {
      const updatedProducts = products.filter((p) => p.itemId !== productId)
      await redis.set(CACHE_KEYS.PRODUCTS, JSON.stringify(updatedProducts), { ex: CACHE_TTL.PRODUCTS })
    }

    logger.info(`Produto ${productId} adicionado à lista de excluídos`)
  } catch (error) {
    logger.error(`Erro ao adicionar produto ${productId} à lista de excluídos:`, error)
  }
}

/**
 * Verifica se um produto está na lista de excluídos
 */
export async function isProductExcluded(productId: string): Promise<boolean> {
  try {
    const redis = getRedisClient()
    if (!redis) {
      logger.warning(`Cliente Redis não disponível ao verificar se produto ${productId} está excluído`)
      return false
    }

    return (await redis.sismember(CACHE_KEYS.EXCLUDED_PRODUCTS, productId)) === 1
  } catch (error) {
    logger.error(`Erro ao verificar se o produto ${productId} está excluído:`, error)
    return false
  }
}

/**
 * Obtém a lista de produtos excluídos
 */
export async function getExcludedProducts(): Promise<string[]> {
  try {
    const redis = getRedisClient()
    if (!redis) {
      logger.warning("Cliente Redis não disponível ao obter produtos excluídos")
      return []
    }

    return await redis.smembers(CACHE_KEYS.EXCLUDED_PRODUCTS)
  } catch (error) {
    logger.error("Erro ao obter produtos excluídos:", error)
    return []
  }
}

/**
 * Salva um card gerado no Redis
 */
export async function saveCard(cardData: any): Promise<void> {
  try {
    const redis = getRedisClient()
    if (!redis) {
      logger.warning("Cliente Redis não disponível ao salvar card")
      return
    }

    const { productId } = cardData

    if (!productId) {
      throw new Error("ID do produto é obrigatório para salvar o card")
    }

    // Garantir que estamos salvando uma string JSON
    const cardDataString = typeof cardData === "string" ? cardData : JSON.stringify(cardData)

    // Adicionar ID do card ao conjunto de cards
    await redis.sadd(CACHE_KEYS.CARDS, productId)

    // Definir TTL se o conjunto for recém-criado
    const ttl = await redis.ttl(CACHE_KEYS.CARDS)
    if (ttl < 0) {
      await redis.expire(CACHE_KEYS.CARDS, CACHE_TTL.CARDS)
    }

    // Salvar dados do card
    await redis.set(`${CACHE_KEYS.CARD_PREFIX}${productId}`, cardDataString, {
      ex: CACHE_TTL.CARDS,
    })

    // Adicionar o produto à lista de excluídos
    await addExcludedProduct(productId)

    logger.info(`Card para o produto ${productId} salvo com sucesso`)
  } catch (error) {
    logger.error("Erro ao salvar card:", error)
    throw error
  }
}

/**
 * Obtém todos os cards gerados
 */
export async function getCards(): Promise<any[]> {
  try {
    const redis = getRedisClient()
    if (!redis) {
      logger.warning("Cliente Redis não disponível ao obter cards")
      return []
    }

    const cardIds = await redis.smembers(CACHE_KEYS.CARDS)

    if (!cardIds || cardIds.length === 0) {
      return []
    }

    const cards = []
    for (const cardId of cardIds) {
      try {
        const cardData = await redis.get(`${CACHE_KEYS.CARD_PREFIX}${cardId}`)
        if (cardData) {
          // Garantir que estamos lidando com uma string antes de fazer o parse
          if (typeof cardData === "string") {
            try {
              cards.push(JSON.parse(cardData))
            } catch (parseError) {
              logger.error(`Erro ao analisar dados do card ${cardId}:`, parseError)
              // Tentar usar os dados brutos se o parse falhar
              cards.push({ productId: cardId, error: "Erro ao analisar dados", rawData: cardData })
            }
          } else if (typeof cardData === "object") {
            // Se já for um objeto, usar diretamente
            cards.push(cardData)
          }
        }
      } catch (error) {
        logger.error(`Erro ao obter card ${cardId}:`, error)
      }
    }

    return cards
  } catch (error) {
    logger.error("Erro ao obter cards:", error)
    return []
  }
}

/**
 * Publica um card (move da lista de cards para a lista de publicados)
 */
export async function publishCard(productId: string): Promise<void> {
  try {
    const redis = getRedisClient()
    if (!redis) {
      logger.warning(`Cliente Redis não disponível ao publicar card ${productId}`)
      return
    }

    // Verificar se o card existe
    const cardData = await redis.get(`${CACHE_KEYS.CARD_PREFIX}${productId}`)
    if (!cardData) {
      throw new Error(`Card para o produto ${productId} não encontrado`)
    }

    // Adicionar à lista de cards publicados
    await redis.sadd(CACHE_KEYS.PUBLISHED_CARDS, productId)

    // Definir TTL se o conjunto for recém-criado
    const ttl = await redis.ttl(CACHE_KEYS.PUBLISHED_CARDS)
    if (ttl < 0) {
      await redis.expire(CACHE_KEYS.PUBLISHED_CARDS, CACHE_TTL.PUBLISHED_CARDS)
    }

    // Remover da lista de cards não publicados
    await redis.srem(CACHE_KEYS.CARDS, productId)

    // Atualizar os dados do card com a data de publicação
    let cardObj
    if (typeof cardData === "string") {
      try {
        cardObj = JSON.parse(cardData)
      } catch (error) {
        logger.error(`Erro ao analisar dados do card ${productId}:`, error)
        // Criar um objeto básico se o parse falhar
        cardObj = { productId, error: "Erro ao analisar dados" }
      }
    } else {
      cardObj = cardData
    }

    cardObj.publishedAt = new Date().toISOString()

    // Salvar os dados atualizados
    await redis.set(`${CACHE_KEYS.CARD_PREFIX}${productId}`, JSON.stringify(cardObj), {
      ex: CACHE_TTL.PUBLISHED_CARDS,
    })

    logger.info(`Card para o produto ${productId} publicado com sucesso`)
  } catch (error) {
    logger.error(`Erro ao publicar card ${productId}:`, error)
    throw error
  }
}

/**
 * Obtém todos os cards publicados
 */
export async function getPublishedCards(): Promise<any[]> {
  try {
    const redis = getRedisClient()
    if (!redis) {
      logger.warning("Cliente Redis não disponível ao obter cards publicados")
      return []
    }

    const cardIds = await redis.smembers(CACHE_KEYS.PUBLISHED_CARDS)

    if (!cardIds || cardIds.length === 0) {
      return []
    }

    const cards = []
    for (const cardId of cardIds) {
      try {
        const cardData = await redis.get(`${CACHE_KEYS.CARD_PREFIX}${cardId}`)
        if (cardData) {
          // Garantir que estamos lidando com uma string antes de fazer o parse
          if (typeof cardData === "string") {
            try {
              cards.push(JSON.parse(cardData))
            } catch (parseError) {
              logger.error(`Erro ao analisar dados do card publicado ${cardId}:`, parseError)
              // Tentar usar os dados brutos se o parse falhar
              cards.push({ productId: cardId, error: "Erro ao analisar dados", rawData: cardData })
            }
          } else if (typeof cardData === "object") {
            // Se já for um objeto, usar diretamente
            cards.push(cardData)
          }
        }
      } catch (error) {
        logger.error(`Erro ao obter card publicado ${cardId}:`, error)
      }
    }

    return cards
  } catch (error) {
    logger.error("Erro ao obter cards publicados:", error)
    return []
  }
}

export async function cleanupCache(): Promise<void> {
  // Redis automatically removes expired keys, but we might want to manually clean up some data
  logger.info("Running cache cleanup...")

  try {
    // We could implement additional cleanup logic here if needed
    logger.info("Cache cleanup completed")
  } catch (error) {
    logger.error("Error during cache cleanup:", error)
  }
}

/**
 * Salva um vídeo gerado no Redis
 */
export async function saveVideo(videoData: any): Promise<void> {
  try {
    const redis = getRedisClient()
    if (!redis) {
      logger.warning("Cliente Redis não disponível ao salvar vídeo")
      return
    }

    const { productId } = videoData

    if (!productId) {
      throw new Error("ID do produto é obrigatório para salvar o vídeo")
    }

    // Garantir que estamos salvando uma string JSON
    const videoDataString = typeof videoData === "string" ? videoData : JSON.stringify(videoData)

    // Adicionar ID do vídeo ao conjunto de vídeos
    await redis.sadd("shopee:videos", productId)

    // Definir TTL se o conjunto for recém-criado
    const ttl = await redis.ttl("shopee:videos")
    if (ttl < 0) {
      await redis.expire("shopee:videos", CACHE_TTL.CARDS) // Usando o mesmo TTL dos cards
    }

    // Salvar dados do vídeo
    await redis.set(`shopee:video:${productId}`, videoDataString, {
      ex: CACHE_TTL.CARDS,
    })

    logger.info(`Vídeo para o produto ${productId} salvo com sucesso`)
  } catch (error) {
    logger.error("Erro ao salvar vídeo:", error)
    throw error
  }
}

/**
 * Obtém todos os vídeos gerados
 */
export async function getVideos(): Promise<any[]> {
  try {
    const redis = getRedisClient()
    if (!redis) {
      logger.warning("Cliente Redis não disponível ao obter vídeos")
      return []
    }

    const videoIds = await redis.smembers("shopee:videos")

    if (!videoIds || videoIds.length === 0) {
      return []
    }

    const videos = []
    for (const videoId of videoIds) {
      try {
        const videoData = await redis.get(`shopee:video:${videoId}`)
        if (videoData) {
          // Garantir que estamos lidando com uma string antes de fazer o parse
          if (typeof videoData === "string") {
            try {
              videos.push(JSON.parse(videoData))
            } catch (parseError) {
              logger.error(`Erro ao analisar dados do vídeo ${videoId}:`, parseError)
              // Tentar usar os dados brutos se o parse falhar
              videos.push({ productId: videoId, error: "Erro ao analisar dados", rawData: videoData })
            }
          } else if (typeof videoData === "object") {
            // Se já for um objeto, usar diretamente
            videos.push(videoData)
          }
        }
      } catch (error) {
        logger.error(`Erro ao obter vídeo ${videoId}:`, error)
      }
    }

    return videos
  } catch (error) {
    logger.error("Erro ao obter vídeos:", error)
    return []
  }
}

/**
 * Publica um vídeo (move da lista de vídeos para a lista de publicados)
 */
export async function publishVideo(productId: string): Promise<void> {
  try {
    const redis = getRedisClient()
    if (!redis) {
      logger.warning(`Cliente Redis não disponível ao publicar vídeo ${productId}`)
      return
    }

    // Verificar se o vídeo existe
    const videoData = await redis.get(`shopee:video:${productId}`)
    if (!videoData) {
      throw new Error(`Vídeo para o produto ${productId} não encontrado`)
    }

    // Adicionar à lista de vídeos publicados
    await redis.sadd("shopee:published_videos", productId)

    // Definir TTL se o conjunto for recém-criado
    const ttl = await redis.ttl("shopee:published_videos")
    if (ttl < 0) {
      await redis.expire("shopee:published_videos", CACHE_TTL.PUBLISHED_CARDS)
    }

    // Remover da lista de vídeos não publicados
    await redis.srem("shopee:videos", productId)

    // Atualizar os dados do vídeo com a data de publicação
    let videoObj
    if (typeof videoData === "string") {
      try {
        videoObj = JSON.parse(videoData)
      } catch (error) {
        logger.error(`Erro ao analisar dados do vídeo ${productId}:`, error)
        // Criar um objeto básico se o parse falhar
        videoObj = { productId, error: "Erro ao analisar dados" }
      }
    } else {
      videoObj = videoData
    }

    videoObj.publishedAt = new Date().toISOString()

    // Salvar os dados atualizados
    await redis.set(`shopee:video:${productId}`, JSON.stringify(videoObj), {
      ex: CACHE_TTL.PUBLISHED_CARDS,
    })

    logger.info(`Vídeo para o produto ${productId} publicado com sucesso`)
  } catch (error) {
    logger.error(`Erro ao publicar vídeo ${productId}:`, error)
    throw error
  }
}

/**
 * Obtém todos os vídeos publicados
 */
export async function getPublishedVideos(): Promise<any[]> {
  try {
    const redis = getRedisClient()
    if (!redis) {
      logger.warning("Cliente Redis não disponível ao obter vídeos publicados")
      return []
    }

    const videoIds = await redis.smembers("shopee:published_videos")

    if (!videoIds || videoIds.length === 0) {
      return []
    }

    const videos = []
    for (const videoId of videoIds) {
      try {
        const videoData = await redis.get(`shopee:video:${videoId}`)
        if (videoData) {
          // Garantir que estamos lidando com uma string antes de fazer o parse
          if (typeof videoData === "string") {
            try {
              videos.push(JSON.parse(videoData))
            } catch (parseError) {
              logger.error(`Erro ao analisar dados do vídeo publicado ${videoId}:`, parseError)
              // Tentar usar os dados brutos se o parse falhar
              videos.push({ productId: videoId, error: "Erro ao analisar dados", rawData: videoData })
            }
          } else if (typeof videoData === "object") {
            // Se já for um objeto, usar diretamente
            videos.push(videoData)
          }
        }
      } catch (error) {
        logger.error(`Erro ao obter vídeo publicado ${videoId}:`, error)
      }
    }

    return videos
  } catch (error) {
    logger.error("Erro ao obter vídeos publicados:", error)
    return []
  }
}

// Exportar o cliente Redis para uso direto
export const redis = getRedisClient()
export default redis
