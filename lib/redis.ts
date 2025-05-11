import { Redis } from "@upstash/redis"
import { CACHE_KEYS } from "@/lib/constants"
import { createLogger } from "./logger"

const logger = createLogger("Redis")

// Simulação de dados em memória para fallback
const inMemoryStore: Record<string, any> = {
  videos: new Set<string>(),
  publishedVideos: new Set<string>(),
  videoData: new Map<string, any>(),
  products: null,
  descriptions: new Map<string, string>(),
  processedIds: new Set<string>(),
  excludedProducts: new Set<string>(),
}

// Estado do fallback
let isFallbackActive = false

// Initialize Redis client
let redis: Redis | null = null

try {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    redis = new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    })
    logger.info("Redis client initialized with Upstash")
  } else {
    logger.warn("Redis credentials not found. Redis functionality will be limited.")
    isFallbackActive = true
  }
} catch (error) {
  logger.error("Failed to initialize Redis client with Upstash:", error)
  isFallbackActive = true
  redis = null
}

// Funções de fallback
const fallback = {
  isActive: () => isFallbackActive,
  activate: () => {
    isFallbackActive = true
    logger.info("Redis fallback activated")
  },
  deactivate: () => {
    isFallbackActive = false
    logger.info("Redis fallback deactivated")
  },
  getVideos: () => {
    const videos = []
    for (const videoId of inMemoryStore.videos) {
      const videoData = inMemoryStore.videoData.get(videoId)
      if (videoData) {
        videos.push(videoData)
      }
    }
    return videos
  },
  getPublishedVideos: () => {
    const videos = []
    for (const videoId of inMemoryStore.publishedVideos) {
      const videoData = inMemoryStore.videoData.get(videoId)
      if (videoData) {
        videos.push(videoData)
      }
    }
    return videos
  },
  publishVideo: (productId: string) => {
    const videoData = inMemoryStore.videoData.get(productId)
    if (!videoData) {
      return false
    }
    inMemoryStore.videos.delete(productId)
    inMemoryStore.publishedVideos.add(productId)
    videoData.status = "published"
    videoData.publishedAt = new Date().toISOString()
    inMemoryStore.videoData.set(productId, videoData)
    return true
  },
  saveVideo: (videoData: any) => {
    const productId = videoData.productId
    if (!productId) {
      return false
    }
    inMemoryStore.videos.add(productId)
    inMemoryStore.videoData.set(productId, videoData)
    return true
  },
  isIdProcessed: (productId: string) => {
    return inMemoryStore.processedIds.has(productId)
  },
  addProcessedId: (productId: string) => {
    inMemoryStore.processedIds.add(productId)
    return true
  },
  getExcludedProducts: () => {
    return Array.from(inMemoryStore.excludedProducts)
  },
  cacheProducts: (products: any[]) => {
    inMemoryStore.products = products
    return true
  },
  getCachedProducts: () => {
    return inMemoryStore.products
  },
  cacheDescription: (productId: string, description: string) => {
    inMemoryStore.descriptions.set(productId, description)
    return true
  },
  getCachedDescription: (productId: string) => {
    return inMemoryStore.descriptions.get(productId) || null
  },
  cleanupCache: () => {
    inMemoryStore.products = null
    inMemoryStore.processedIds.clear()
    return true
  },
  getCachedProduct: (productId: string) => {
    if (!inMemoryStore.products) return null
    return inMemoryStore.products.find((p: any) => p.itemId === productId) || null
  },
}

export function getRedisClient(): Redis | null {
  return redis
}

export async function isRedisAvailable(): Promise<boolean> {
  try {
    if (!redis) {
      return false
    }
    await redis.ping()
    return true
  } catch (error) {
    logger.error("Redis connection failed", { error })
    fallback.activate()
    return false
  }
}

export async function getVideos() {
  try {
    if (!redis) {
      if (fallback.isActive()) {
        return fallback.getVideos()
      }
      return []
    }
    const videoIds = await redis.smembers(CACHE_KEYS.VIDEOS)
    if (!videoIds || videoIds.length === 0) return []

    const videos = []
    for (const videoId of videoIds) {
      const video = await redis.get(`${CACHE_KEYS.VIDEO_PREFIX}${videoId}`)
      if (video) {
        videos.push(typeof video === "string" ? JSON.parse(video) : video)
      }
    }
    return videos
  } catch (error) {
    logger.error("Error getting videos", { error })
    if (fallback.isActive()) {
      return fallback.getVideos()
    }
    return []
  }
}

export async function getPublishedVideos() {
  try {
    if (!redis) {
      if (fallback.isActive()) {
        return fallback.getPublishedVideos()
      }
      return []
    }
    const videoIds = await redis.smembers(CACHE_KEYS.PUBLISHED_VIDEOS)
    if (!videoIds || videoIds.length === 0) return []

    const videos = []
    for (const videoId of videoIds) {
      const video = await redis.get(`${CACHE_KEYS.VIDEO_PREFIX}${videoId}`)
      if (video) {
        videos.push(typeof video === "string" ? JSON.parse(video) : video)
      }
    }
    return videos
  } catch (error) {
    logger.error("Error getting published videos", { error })
    if (fallback.isActive()) {
      return fallback.getPublishedVideos()
    }
    return []
  }
}

export async function publishVideo(productId: string) {
  try {
    if (!redis) {
      if (fallback.isActive()) {
        return fallback.publishVideo(productId)
      }
      return false
    }
    // Get the video data
    const videoData = await redis.get(`${CACHE_KEYS.VIDEO_PREFIX}${productId}`)
    if (!videoData) {
      throw new Error(`Video with ID ${productId} not found`)
    }

    // Parse the video data
    const video = typeof videoData === "string" ? JSON.parse(videoData) : videoData

    // Add the video ID to the published videos set
    await redis.sadd(CACHE_KEYS.PUBLISHED_VIDEOS, productId)

    // Update the video data with the published status and timestamp
    video.status = "published"
    video.publishedAt = new Date().toISOString()

    // Save the updated video data
    await redis.set(`${CACHE_KEYS.VIDEO_PREFIX}${productId}`, JSON.stringify(video))

    return true
  } catch (error) {
    logger.error("Error publishing video", { error })
    if (fallback.isActive()) {
      return fallback.publishVideo(productId)
    }
    return false
  }
}

export async function saveVideo(videoData: any) {
  try {
    if (!redis) {
      if (fallback.isActive()) {
        return fallback.saveVideo(videoData)
      }
      return false
    }
    // Add the video ID to the videos set
    await redis.sadd(CACHE_KEYS.VIDEOS, videoData.productId)

    // Save the video data
    await redis.set(`${CACHE_KEYS.VIDEO_PREFIX}${videoData.productId}`, JSON.stringify(videoData))

    return true
  } catch (error) {
    logger.error("Error saving video", { error })
    if (fallback.isActive()) {
      return fallback.saveVideo(videoData)
    }
    return false
  }
}

export async function isIdProcessed(productId: string): Promise<boolean> {
  try {
    if (!redis) {
      if (fallback.isActive()) {
        return fallback.isIdProcessed(productId)
      }
      return false
    }
    const processed = await redis.sismember(CACHE_KEYS.PROCESSED_IDS, productId)
    return processed === 1
  } catch (error) {
    logger.error("Error checking if ID is processed", { error })
    if (fallback.isActive()) {
      return fallback.isIdProcessed(productId)
    }
    return false
  }
}

export async function addProcessedId(productId: string) {
  try {
    if (!redis) {
      if (fallback.isActive()) {
        return fallback.addProcessedId(productId)
      }
      return false
    }
    await redis.sadd(CACHE_KEYS.PROCESSED_IDS, productId)
    return true
  } catch (error) {
    logger.error("Error adding processed ID", { error })
    if (fallback.isActive()) {
      return fallback.addProcessedId(productId)
    }
    return false
  }
}

export async function getExcludedProducts(): Promise<string[]> {
  try {
    if (!redis) {
      if (fallback.isActive()) {
        return fallback.getExcludedProducts()
      }
      return []
    }
    const excluded = await redis.smembers(CACHE_KEYS.EXCLUDED_PRODUCTS)
    return excluded as string[]
  } catch (error) {
    logger.error("Error getting excluded products", { error })
    if (fallback.isActive()) {
      return fallback.getExcludedProducts()
    }
    return []
  }
}

export async function cacheProducts(products: any[], expirationInSeconds = 3600) {
  try {
    if (!redis) {
      if (fallback.isActive()) {
        return fallback.cacheProducts(products)
      }
      return false
    }
    await redis.setex(CACHE_KEYS.PRODUCTS, expirationInSeconds, JSON.stringify(products))
    return true
  } catch (error) {
    logger.error("Error caching products", { error })
    if (fallback.isActive()) {
      return fallback.cacheProducts(products)
    }
    return false
  }
}

export async function getCachedProducts(): Promise<any[] | null> {
  try {
    if (!redis) {
      if (fallback.isActive()) {
        return fallback.getCachedProducts()
      }
      return null
    }
    const data = await redis.get(CACHE_KEYS.PRODUCTS)
    return data ? (typeof data === "string" ? JSON.parse(data) : data) : null
  } catch (error) {
    logger.error("Error getting cached products", { error })
    if (fallback.isActive()) {
      return fallback.getCachedProducts()
    }
    return null
  }
}

export async function cacheDescription(productId: string, description: string, expirationInSeconds = 3600) {
  try {
    if (!redis) {
      if (fallback.isActive()) {
        return fallback.cacheDescription(productId, description)
      }
      return false
    }
    await redis.setex(`shopee:description:${productId}`, expirationInSeconds, description)
    return true
  } catch (error) {
    logger.error("Error caching description", { error })
    if (fallback.isActive()) {
      return fallback.cacheDescription(productId, description)
    }
    return false
  }
}

export async function getCachedDescription(productId: string): Promise<string | null> {
  try {
    if (!redis) {
      if (fallback.isActive()) {
        return fallback.getCachedDescription(productId)
      }
      return null
    }
    const data = await redis.get(`shopee:description:${productId}`)
    return data ? (data as string) : null
  } catch (error) {
    logger.error("Error getting cached description", { error })
    if (fallback.isActive()) {
      return fallback.getCachedDescription(productId)
    }
    return null
  }
}

export async function cleanupCache() {
  try {
    if (!redis) {
      if (fallback.isActive()) {
        return fallback.cleanupCache()
      }
      return false
    }
    // Delete products
    await redis.del(CACHE_KEYS.PRODUCTS)

    // Delete processed IDs
    await redis.del(CACHE_KEYS.PROCESSED_IDS)

    return true
  } catch (error) {
    logger.error("Error cleaning up cache", { error })
    if (fallback.isActive()) {
      return fallback.cleanupCache()
    }
    return false
  }
}

export async function getCachedProduct(productId: string): Promise<any | null> {
  try {
    if (!redis) {
      if (fallback.isActive()) {
        return fallback.getCachedProduct(productId)
      }
      return null
    }
    // Primeiro tente obter o produto diretamente pela chave individual
    const product = await redis.get(`${CACHE_KEYS.PRODUCT_PREFIX}${productId}`)

    if (product) {
      return typeof product === "string" ? JSON.parse(product) : product
    }

    // Se não encontrar, tente buscar na lista completa
    const products = await getCachedProducts()
    if (!products) return null

    return products.find((p) => p.itemId === productId) || null
  } catch (error) {
    logger.error("Error getting cached product", { error })
    if (fallback.isActive()) {
      return fallback.getCachedProduct(productId)
    }
    return null
  }
}

// Exportar o cliente Redis para uso direto
export { redis }
export default redis
