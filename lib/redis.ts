import { Redis } from "@upstash/redis"
import { createLogger } from "./logger"

const logger = createLogger("Redis")

let redisClient: Redis | null = null

export const CACHE_KEYS = {
  PRODUCTS: "products",
  VIDEOS: "videos",
  PUBLISHED_VIDEOS: "published_videos",
  PROCESSED_IDS: "processed_ids",
  DESCRIPTIONS: "descriptions",
  SCHEDULES: "schedules",
  EXECUTION_HISTORY: "execution_history",
  DESCRIPTION_PREFIX: "product_description:",
  VIDEO_PREFIX: "video:",
}

export async function getRedisClient(): Promise<Redis | null> {
  if (redisClient) {
    return redisClient
  }

  try {
    // Verificar se as variáveis de ambiente estão definidas
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      logger.warn("Redis environment variables are not set")
      return null
    }

    // Criar cliente Redis
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })

    // Testar conexão
    await redisClient.ping()
    logger.info("Redis client initialized successfully")

    return redisClient
  } catch (error) {
    logger.error("Failed to initialize Redis client:", error)
    redisClient = null
    return null
  }
}

// Função para obter produtos em cache
export async function getCachedProducts(): Promise<any | null> {
  try {
    const redis = await getRedisClient()

    if (!redis) {
      logger.warn("Redis client not available, returning null for cached products")
      return null
    }

    const productsJson = await redis.get(CACHE_KEYS.PRODUCTS)

    if (!productsJson) {
      logger.warn("No products found in cache")
      return null
    }

    return JSON.parse(productsJson as string)
  } catch (error) {
    logger.error("Error getting cached products:", error)
    return null
  }
}

// Função para obter vídeos em cache
export async function getVideos(): Promise<any[]> {
  try {
    const redis = await getRedisClient()

    if (!redis) {
      logger.warn("Redis client not available, returning empty videos array")
      return []
    }

    const videosJson = await redis.get(CACHE_KEYS.VIDEOS)

    if (!videosJson) {
      logger.warn("No videos found in cache")
      return []
    }

    return JSON.parse(videosJson as string)
  } catch (error) {
    logger.error("Error getting cached videos:", error)
    return []
  }
}

// Função para obter vídeos publicados em cache
export async function getPublishedVideos(): Promise<any[]> {
  try {
    const redis = await getRedisClient()

    if (!redis) {
      logger.warn("Redis client not available, returning empty published videos array")
      return []
    }

    const videosJson = await redis.get(CACHE_KEYS.PUBLISHED_VIDEOS)

    if (!videosJson) {
      logger.warn("No published videos found in cache")
      return []
    }

    return JSON.parse(videosJson as string)
  } catch (error) {
    logger.error("Error getting cached published videos:", error)
    return []
  }
}

// Função para verificar se o ID já foi processado
export async function isIdProcessed(id: string): Promise<boolean> {
  try {
    const redis = await getRedisClient()

    if (!redis) {
      logger.warn("Redis client not available, returning false for isIdProcessed")
      return false
    }

    const processed = await redis.sismember(CACHE_KEYS.PROCESSED_IDS, id)
    return processed === 1
  } catch (error) {
    logger.error(`Error checking if ID ${id} is processed:`, error)
    return false
  }
}

// Função para adicionar o ID aos processados
export async function addProcessedId(id: string): Promise<void> {
  try {
    const redis = await getRedisClient()

    if (!redis) {
      logger.warn("Redis client not available, cannot add processed ID")
      return
    }

    await redis.sadd(CACHE_KEYS.PROCESSED_IDS, id)
    logger.info(`Added ID ${id} to processed IDs`)
  } catch (error) {
    logger.error(`Error adding ID ${id} to processed IDs:`, error)
  }
}

// Função para obter a descrição em cache
export async function getCachedDescription(productId: string): Promise<string | null> {
  try {
    const redis = await getRedisClient()

    if (!redis) {
      logger.warn("Redis client not available, cannot get cached description")
      return null
    }

    const description = await redis.get(`${CACHE_KEYS.DESCRIPTION_PREFIX}${productId}`)
    return description as string | null
  } catch (error) {
    logger.error(`Error getting cached description for product ${productId}:`, error)
    return null
  }
}

const redis = {
  getVideos,
  getPublishedVideos,
  isIdProcessed,
  addProcessedId,
  getCachedDescription,
  getCachedProducts,
  getRedisClient,
  CACHE_KEYS,
}

export default redis
