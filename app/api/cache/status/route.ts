import { NextResponse } from "next/server"
import redis from "@/lib/redis"

export async function GET() {
  try {
    // Get cache statistics
    const stats = {
      info: "Not available",
      keys: { products: 0, processedIds: 0 },
      memory: "Unknown",
      uptime: "Unknown",
    }
    let descriptionKeys = []
    const descriptionSamples = {}

    try {
      // Instead of using INFO command, we'll collect basic stats using available methods
      const basicInfo = {
        version: "Upstash Redis",
        status: "Connected",
        timestamp: new Date().toISOString(),
      }

      stats.info = basicInfo
    } catch (infoError) {
      console.error("Error getting Redis basic info:", infoError)
      stats.info = { error: "Failed to get Redis info", message: infoError.message }
    }

    try {
      // Try to check if products exist in cache
      stats.keys.products = await redis.exists("shopee:products")
    } catch (error) {
      console.error("Error checking products cache:", error)
    }

    try {
      // Try to get processed IDs count
      stats.keys.processedIds = await redis.scard("shopee:processed_ids")
    } catch (error) {
      console.error("Error getting processed IDs count:", error)
    }

    try {
      // Get a sample of cached descriptions
      descriptionKeys = await redis.keys("shopee:description:*")

      if (descriptionKeys.length > 0) {
        // Get up to 5 samples
        const sampleKeys = descriptionKeys.slice(0, 5)
        for (const key of sampleKeys) {
          const productId = key.split(":")[2]
          try {
            descriptionSamples[productId] = await redis.get(key)
          } catch (error) {
            console.error(`Error getting description for ${productId}:`, error)
            descriptionSamples[productId] = "Error retrieving description"
          }
        }
      }
    } catch (error) {
      console.error("Error getting description keys:", error)
      descriptionKeys = []
    }

    // Get total number of keys in Redis
    let totalKeys = 0
    try {
      // Get all keys matching our application pattern
      const allKeys = await redis.keys("shopee:*")
      totalKeys = allKeys.length
    } catch (error) {
      console.error("Error getting total keys:", error)
    }

    return NextResponse.json({
      success: true,
      stats: {
        ...stats,
        totalKeys,
      },
      descriptionKeys: descriptionKeys.length,
      descriptionSamples,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error getting cache status:", error)
    return NextResponse.json({
      success: false,
      message: "Failed to get cache status",
      error: error.message,
      timestamp: new Date().toISOString(),
    })
  }
}
