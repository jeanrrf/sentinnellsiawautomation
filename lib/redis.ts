import { createLogger } from "./logger"

const logger = createLogger("redis")

// Define types for Redis client
interface RedisClient {
  get: (key: string) => Promise<string | null>
  set: (key: string, value: string, options?: any) => Promise<void>
  sadd: (key: string, ...members: string[]) => Promise<number>
  srem: (key: string, member: string) => Promise<number>
  smembers: (key: string) => Promise<string[]>
  sismember: (key: string, member: string) => Promise<number>
}

// Redis keys
export const CACHE_KEYS = {
  PRODUCTS: "products",
  VIDEOS: "videos",
  PUBLISHED_VIDEOS: "published_videos",
  PROCESSED_IDS: "processed_ids",
  DESCRIPTIONS: "descriptions",
  SCHEDULES: "schedules",
  EXECUTION_HISTORY: "execution_history",
  VIDEO_PREFIX: "video:",
  DESCRIPTION_PREFIX: "description:",
  EXCLUDED_PRODUCTS: "excluded_products",
}

// In-memory storage for fallback
const inMemoryStorage: Record<string, string> = {}
const inMemorySets: Record<string, Set<string>> = {}

// In-memory Redis client for fallback
const inMemoryRedisClient: RedisClient = {
  async get(key: string) {
    logger.warn(`Using in-memory Redis fallback for GET: ${key}`)
    return inMemoryStorage[key] || null
  },
  async set(key: string, value: string, options?: any) {
    logger.warn(`Using in-memory Redis fallback for SET: ${key}`)
    inMemoryStorage[key] = value
  },
  async sadd(key: string, ...members: string[]) {
    logger.warn(`Using in-memory Redis fallback for SADD: ${key}`)
    if (!inMemorySets[key]) {
      inMemorySets[key] = new Set()
    }
    members.forEach((member) => inMemorySets[key].add(member))
    return members.length
  },
  async srem(key: string, member: string) {
    logger.warn(`Using in-memory Redis fallback for SREM: ${key}`)
    if (inMemorySets[key]) {
      inMemorySets[key].delete(member)
      return 1
    }
    return 0
  },
  async smembers(key: string) {
    logger.warn(`Using in-memory Redis fallback for SMEMBERS: ${key}`)
    return Array.from(inMemorySets[key] || new Set())
  },
  async sismember(key: string, member: string) {
    logger.warn(`Using in-memory Redis fallback for SISMEMBER: ${key}`)
    return inMemorySets[key]?.has(member) ? 1 : 0
  },
}

// Redis client instance
let redisClient: RedisClient | null = null

/**
 * Initializes and returns the Redis client
 */
export async function getRedisClient(): Promise<RedisClient | null> {
  if (redisClient) {
    return redisClient
  }

  try {
    // Check if we have the Redis URL
    const redisUrl = process.env.REDIS_URL || process.env.KV_REST_API_URL || process.env.KV_URL

    if (!redisUrl) {
      logger.warn("Redis URL not found in environment variables, using in-memory fallback")
      redisClient = inMemoryRedisClient
      return redisClient
    }

    // Import the Redis client
    const { Redis } = await import("@upstash/redis")

    // Create Redis client
    redisClient = new Redis({
      url: redisUrl,
      token: process.env.KV_REST_API_TOKEN || process.env.KV_REST_API_TOKEN,
    })

    logger.info("Redis client initialized successfully")
    return redisClient
  } catch (error) {
    logger.error("Failed to initialize Redis client:", error)
    logger.warn("Using in-memory fallback for Redis")
    redisClient = inMemoryRedisClient
    return redisClient
  }
}

/**
 * Get videos from Redis
 */
export async function getVideos(): Promise<any[]> {
  try {
    const redis = await getRedisClient()
    if (!redis) return []

    const videosJson = await redis.get(CACHE_KEYS.VIDEOS)
    return videosJson ? JSON.parse(videosJson) : []
  } catch (error) {
    logger.error("Error getting videos:", error)
    return []
  }
}

/**
 * Get published videos from Redis
 */
export async function getPublishedVideos(): Promise<any[]> {
  try {
    const redis = await getRedisClient()
    if (!redis) return []

    const videosJson = await redis.get(CACHE_KEYS.PUBLISHED_VIDEOS)
    return videosJson ? JSON.parse(videosJson) : []
  } catch (error) {
    logger.error("Error getting published videos:", error)
    return []
  }
}

/**
 * Check if ID has been processed
 */
export async function isIdProcessed(id: string): Promise<boolean> {
  try {
    const redis = await getRedisClient()
    if (!redis) return false

    const isMember = await redis.sismember(CACHE_KEYS.PROCESSED_IDS, id)
    return isMember === 1
  } catch (error) {
    logger.error(`Error checking if ID ${id} is processed:`, error)
    return false
  }
}

/**
 * Add processed ID
 */
export async function addProcessedId(id: string): Promise<void> {
  try {
    const redis = await getRedisClient()
    if (!redis) return

    await redis.sadd(CACHE_KEYS.PROCESSED_IDS, id)
    logger.info(`Added ID ${id} to processed IDs`)
  } catch (error) {
    logger.error(`Error adding ID ${id} to processed IDs:`, error)
  }
}

/**
 * Get cached products from Redis
 */
export async function getCachedProducts(): Promise<any[] | null> {
  try {
    const redis = await getRedisClient()
    if (!redis) return null

    const productsJson = await redis.get(CACHE_KEYS.PRODUCTS)
    if (!productsJson) return null

    return JSON.parse(productsJson)
  } catch (error) {
    logger.error("Error getting cached products:", error)
    return null
  }
}

/**
 * Get cached description for a product
 */
export async function getCachedDescription(productId: string): Promise<string | null> {
  try {
    const redis = await getRedisClient()
    if (!redis) return null

    const key = `${CACHE_KEYS.DESCRIPTION_PREFIX}${productId}`
    return await redis.get(key)
  } catch (error) {
    logger.error(`Error getting cached description for product ${productId}:`, error)
    return null
  }
}

// Create the redis object with all functions
const redis = {
  getRedisClient,
  getVideos,
  getPublishedVideos,
  isIdProcessed,
  addProcessedId,
  getCachedProducts,
  getCachedDescription,
  CACHE_KEYS,
}

// Export the redis object as default
export default redis
