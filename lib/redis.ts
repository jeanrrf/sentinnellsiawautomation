import { Redis } from "@upstash/redis"

// Create Redis client with better error handling
let redis: Redis

try {
  // Use REST client which is more reliable for serverless environments
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || "https://moral-slug-22722.upstash.io",
    token: process.env.UPSTASH_REDIS_REST_TOKEN || "AVjCAAIjcDEzYWMzZmZkMGY1OWE0NDVmODFjNmM1NTRmYWFhYWVlOXAxMA",
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
  } as unknown as Redis
}

// Cache TTLs in seconds
export const CACHE_TTL = {
  PRODUCTS: 60 * 60, // 1 hour
  DESCRIPTIONS: 60 * 60 * 24, // 24 hours
  PROCESSED_IDS: 60 * 60 * 24 * 7, // 7 days
}

// Cache keys
export const CACHE_KEYS = {
  PRODUCTS: "shopee:products",
  DESCRIPTION_PREFIX: "shopee:description:",
  PROCESSED_IDS: "shopee:processed_ids",
  PRODUCT_PREFIX: "shopee:product:",
}

// Cache utility functions with error handling
export async function cacheProducts(products: any[]): Promise<void> {
  try {
    // Make sure we're storing a string in Redis
    const productsString = JSON.stringify(products)

    // Cache the full product list
    await redis.set(CACHE_KEYS.PRODUCTS, productsString, { ex: CACHE_TTL.PRODUCTS })

    // Also cache individual products for faster access
    for (const product of products) {
      await redis.set(`${CACHE_KEYS.PRODUCT_PREFIX}${product.itemId}`, JSON.stringify(product), {
        ex: CACHE_TTL.PRODUCTS,
      })
    }

    console.log(`Cached ${products.length} products for ${CACHE_TTL.PRODUCTS} seconds`)
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
