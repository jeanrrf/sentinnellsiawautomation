import { NextResponse } from "next/server"
import { getCachedProducts } from "@/lib/redis"

export async function GET() {
  try {
    console.log("API: Fetching products...")

    // Try to get products from cache
    try {
      const cachedProducts = await getCachedProducts()

      if (cachedProducts && Array.isArray(cachedProducts) && cachedProducts.length > 0) {
        console.log(`API: Returning ${cachedProducts.length} products from cache`)
        return NextResponse.json({
          success: true,
          products: cachedProducts,
          source: "cache",
        })
      } else {
        console.log("API: No valid products found in cache")
      }
    } catch (cacheError) {
      console.error("API: Error accessing Redis cache:", cacheError)
    }

    // If no products in cache, return empty array
    console.log("API: No products found in cache and no mock data will be used")
    return NextResponse.json({
      success: true,
      products: [],
      source: "empty",
    })
  } catch (error) {
    console.error("API: Error fetching products:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch products",
        products: [],
      },
      { status: 500 },
    )
  }
}
