import { Redis } from "@upstash/redis"

// Create Redis client with better error handling
let redis: Redis

try {
  // Use REST client which is more reliable for serverless environments
  redis = new Redis({
    url: process.env.KV_REST_API_URL || "https://moral-slug-22722.upstash.io",
    token: process.env.KV_REST_API_TOKEN || "AVjCAAIjcDEzYWMzZmZkMGY1OWE0NDVmODFjNmM1NTRmYWFhYWVlOXAxMA",
  })

  console.log("Redis client initialized successfully")
} catch (error) {
  console.error("Failed to initialize Redis client:", error)
  // Create a mock Redis client that doesn't throw errors
  redis = {
    get: async () => null,
    set: async () => "OK",
    sadd: async () => 1,
    sismember: async () => 0,
    ttl: async () => -1,
    expire: async () => true,
    exists: async () => 0,
    scard: async () => 0,
    keys: async () => [],
    smembers: async () => [],
    srem: async () => 0,
    del: async () => 0,
  } as unknown as Redis
}

// Cache TTLs in seconds
export const CACHE_TTL = {
  PRODUCTS: 60 * 60, // 1 hour
  DESCRIPTIONS: 60 * 60 * 24, // 24 hours
  PROCESSED_IDS: 60 * 60 * 24 * 7, // 7 days
  PUBLISHED_VIDEOS: 60 * 60 * 24 * 30, // 30 days
  EXCLUDED_PRODUCTS: 60 * 60 * 24 * 90, // 90 days (produtos que não devem ser buscados novamente)
  VIDEOS: 60 * 60 * 24 * 30, // 30 days for videos
}

// Cache keys
export const CACHE_KEYS = {
  PRODUCTS: "shopee:products",
  DESCRIPTION_PREFIX: "shopee:description:",
  PROCESSED_IDS: "shopee:processed_ids",
  PRODUCT_PREFIX: "shopee:product:",
  VIDEOS: "shopee:videos",
  VIDEO_PREFIX: "shopee:video:",
  PUBLISHED_VIDEOS: "shopee:published_videos",
  EXCLUDED_PRODUCTS: "shopee:excluded_products", // Produtos que não devem ser buscados novamente
}

// Cache utility functions with error handling
export async function cacheProducts(products: any[]): Promise<void> {
  try {
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

    console.log(`Cached ${filteredProducts.length} products for ${CACHE_TTL.PRODUCTS} seconds`)
  } catch (error) {
    console.error("Error caching products:", error)
    // Continue execution even if caching fails
  }
}

export async function getCachedProducts(): Promise<any[] | null> {
  try {
    const cachedData = await redis.get(CACHE_KEYS.PRODUCTS)

    if (!cachedData) return null

    // Handle the case where the data might already be an object
    if (typeof cachedData === "object" && !Array.isArray(cachedData) && cachedData !== null) {
      console.log("Cached data is already an object, returning directly")
      return cachedData as any[]
    }

    // If it's a string, parse it
    if (typeof cachedData === "string") {
      try {
        return JSON.parse(cachedData)
      } catch (parseError) {
        console.error("Error parsing cached products:", parseError)
        return null
      }
    }

    // If it's already an array, return it directly
    if (Array.isArray(cachedData)) {
      return cachedData
    }

    console.error("Unexpected cached data format:", typeof cachedData)
    return null
  } catch (error) {
    console.error("Error getting cached products:", error)
    return null
  }
}

export async function getCachedProduct(productId: string): Promise<any | null> {
  try {
    const cachedData = await redis.get(`${CACHE_KEYS.PRODUCT_PREFIX}${productId}`)

    if (!cachedData) return null

    // Handle the case where the data might already be an object
    if (typeof cachedData === "object" && !Array.isArray(cachedData) && cachedData !== null) {
      return cachedData
    }

    // If it's a string, parse it
    if (typeof cachedData === "string") {
      try {
        return JSON.parse(cachedData)
      } catch (parseError) {
        console.error(`Error parsing cached product ${productId}:`, parseError)
        return null
      }
    }

    console.error("Unexpected cached product format:", typeof cachedData)
    return null
  } catch (error) {
    console.error(`Error getting cached product ${productId}:`, error)
    return null
  }
}

export async function cacheDescription(productId: string, description: string): Promise<void> {
  try {
    await redis.set(`${CACHE_KEYS.DESCRIPTION_PREFIX}${productId}`, description, { ex: CACHE_TTL.DESCRIPTIONS })
  } catch (error) {
    console.error(`Error caching description for product ${productId}:`, error)
  }
}

export async function getCachedDescription(productId: string): Promise<string | null> {
  try {
    return redis.get<string>(`${CACHE_KEYS.DESCRIPTION_PREFIX}${productId}`)
  } catch (error) {
    console.error(`Error getting cached description for product ${productId}:`, error)
    return null
  }
}

export async function addProcessedId(productId: string): Promise<void> {
  try {
    await redis.sadd(CACHE_KEYS.PROCESSED_IDS, productId)
    // Set expiration if the set is newly created
    const ttl = await redis.ttl(CACHE_KEYS.PROCESSED_IDS)
    if (ttl < 0) {
      await redis.expire(CACHE_KEYS.PROCESSED_IDS, CACHE_TTL.PROCESSED_IDS)
    }
  } catch (error) {
    console.error(`Error adding processed ID ${productId}:`, error)
  }
}

export async function isIdProcessed(productId: string): Promise<boolean> {
  try {
    return (await redis.sismember(CACHE_KEYS.PROCESSED_IDS, productId)) === 1
  } catch (error) {
    console.error(`Error checking if ID ${productId} is processed:`, error)
    return false
  }
}

/**
 * Adiciona um produto à lista de excluídos
 * Produtos excluídos não serão mais buscados na API ou exibidos nas listas
 */
export async function addExcludedProduct(productId: string): Promise<void> {
  try {
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
    if (products) {
      const updatedProducts = products.filter((p) => p.itemId !== productId)
      await redis.set(CACHE_KEYS.PRODUCTS, JSON.stringify(updatedProducts), { ex: CACHE_TTL.PRODUCTS })
    }

    console.log(`Produto ${productId} adicionado à lista de excluídos`)
  } catch (error) {
    console.error(`Erro ao adicionar produto ${productId} à lista de excluídos:`, error)
  }
}

/**
 * Verifica se um produto está na lista de excluídos
 */
export async function isProductExcluded(productId: string): Promise<boolean> {
  try {
    return (await redis.sismember(CACHE_KEYS.EXCLUDED_PRODUCTS, productId)) === 1
  } catch (error) {
    console.error(`Erro ao verificar se o produto ${productId} está excluído:`, error)
    return false
  }
}

/**
 * Obtém a lista de produtos excluídos
 */
export async function getExcludedProducts(): Promise<string[]> {
  try {
    return await redis.smembers(CACHE_KEYS.EXCLUDED_PRODUCTS)
  } catch (error) {
    console.error("Erro ao obter produtos excluídos:", error)
    return []
  }
}

/**
 * Salva um vídeo gerado no Redis
 */
export async function saveVideo(videoData: any): Promise<void> {
  try {
    const { productId } = videoData

    if (!productId) {
      throw new Error("ID do produto é obrigatório para salvar o vídeo")
    }

    // Garantir que estamos salvando uma string JSON
    const videoDataString = typeof videoData === "string" ? videoData : JSON.stringify(videoData)

    // Adicionar ID do vídeo ao conjunto de vídeos
    await redis.sadd(CACHE_KEYS.VIDEOS, productId)

    // Definir TTL se o conjunto for recém-criado
    const ttl = await redis.ttl(CACHE_KEYS.VIDEOS)
    if (ttl < 0) {
      await redis.expire(CACHE_KEYS.VIDEOS, CACHE_TTL.VIDEOS)
    }

    // Salvar dados do vídeo
    await redis.set(`${CACHE_KEYS.VIDEO_PREFIX}${productId}`, videoDataString, {
      ex: CACHE_TTL.VIDEOS,
    })

    // Adicionar o produto à lista de excluídos
    await addExcludedProduct(productId)

    console.log(`Vídeo para o produto ${productId} salvo com sucesso`)
  } catch (error) {
    console.error("Erro ao salvar vídeo:", error)
    throw error
  }
}

/**
 * Obtém todos os vídeos gerados
 */
export async function getVideos(): Promise<any[]> {
  try {
    const videoIds = await redis.smembers(CACHE_KEYS.VIDEOS)

    if (!videoIds || videoIds.length === 0) {
      return []
    }

    const videos = []
    for (const videoId of videoIds) {
      try {
        const videoData = await redis.get(`${CACHE_KEYS.VIDEO_PREFIX}${videoId}`)
        if (videoData) {
          // Garantir que estamos lidando com uma string antes de fazer o parse
          if (typeof videoData === "string") {
            try {
              videos.push(JSON.parse(videoData))
            } catch (parseError) {
              console.error(`Erro ao analisar dados do vídeo ${videoId}:`, parseError)
              // Tentar usar os dados brutos se o parse falhar
              videos.push({ productId: videoId, error: "Erro ao analisar dados", rawData: videoData })
            }
          } else if (typeof videoData === "object") {
            // Se já for um objeto, usar diretamente
            videos.push(videoData)
          }
        }
      } catch (error) {
        console.error(`Erro ao obter vídeo ${videoId}:`, error)
      }
    }

    return videos
  } catch (error) {
    console.error("Erro ao obter vídeos:", error)
    return []
  }
}

/**
 * Publica um vídeo (move da lista de vídeos para a lista de publicados)
 */
export async function publishVideo(productId: string): Promise<void> {
  try {
    // Verificar se o vídeo existe
    const videoData = await redis.get(`${CACHE_KEYS.VIDEO_PREFIX}${productId}`)
    if (!videoData) {
      throw new Error(`Vídeo para o produto ${productId} não encontrado`)
    }

    // Adicionar à lista de vídeos publicados
    await redis.sadd(CACHE_KEYS.PUBLISHED_VIDEOS, productId)

    // Definir TTL se o conjunto for recém-criado
    const ttl = await redis.ttl(CACHE_KEYS.PUBLISHED_VIDEOS)
    if (ttl < 0) {
      await redis.expire(CACHE_KEYS.PUBLISHED_VIDEOS, CACHE_TTL.PUBLISHED_VIDEOS)
    }

    // Remover da lista de vídeos não publicados
    await redis.srem(CACHE_KEYS.VIDEOS, productId)

    // Atualizar os dados do vídeo com a data de publicação
    let videoObj
    if (typeof videoData === "string") {
      try {
        videoObj = JSON.parse(videoData)
      } catch (error) {
        console.error(`Erro ao analisar dados do vídeo ${productId}:`, error)
        // Criar um objeto básico se o parse falhar
        videoObj = { productId, error: "Erro ao analisar dados" }
      }
    } else {
      videoObj = videoData
    }

    videoObj.publishedAt = new Date().toISOString()

    // Salvar os dados atualizados
    await redis.set(`${CACHE_KEYS.VIDEO_PREFIX}${productId}`, JSON.stringify(videoObj), {
      ex: CACHE_TTL.PUBLISHED_VIDEOS,
    })

    console.log(`Vídeo para o produto ${productId} publicado com sucesso`)
  } catch (error) {
    console.error(`Erro ao publicar vídeo ${productId}:`, error)
    throw error
  }
}

/**
 * Obtém todos os vídeos publicados
 */
export async function getPublishedVideos(): Promise<any[]> {
  try {
    const videoIds = await redis.smembers(CACHE_KEYS.PUBLISHED_VIDEOS)

    if (!videoIds || videoIds.length === 0) {
      return []
    }

    const videos = []
    for (const videoId of videoIds) {
      try {
        const videoData = await redis.get(`${CACHE_KEYS.VIDEO_PREFIX}${videoId}`)
        if (videoData) {
          // Garantir que estamos lidando com uma string antes de fazer o parse
          if (typeof videoData === "string") {
            try {
              videos.push(JSON.parse(videoData))
            } catch (parseError) {
              console.error(`Erro ao analisar dados do vídeo publicado ${videoId}:`, parseError)
              // Tentar usar os dados brutos se o parse falhar
              videos.push({ productId: videoId, error: "Erro ao analisar dados", rawData: videoData })
            }
          } else if (typeof videoData === "object") {
            // Se já for um objeto, usar diretamente
            videos.push(videoData)
          }
        }
      } catch (error) {
        console.error(`Erro ao obter vídeo publicado ${videoId}:`, error)
      }
    }

    return videos
  } catch (error) {
    console.error("Erro ao obter vídeos publicados:", error)
    return []
  }
}

export async function cleanupCache(): Promise<void> {
  // Redis automatically removes expired keys, but we might want to manually clean up some data
  console.log("Running cache cleanup...")

  try {
    // We could implement additional cleanup logic here if needed
    console.log("Cache cleanup completed")
  } catch (error) {
    console.error("Error during cache cleanup:", error)
  }
}

export default redis
