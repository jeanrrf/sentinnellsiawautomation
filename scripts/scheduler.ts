import { promisify } from "util"
import { exec } from "child_process"
import { createLogger } from "../lib/logger"
import { renderProductCardTemplate } from "../lib/template-renderer"
import { createFallbackDescription } from "../lib/template-renderer"
import { html2image } from "../lib/html-to-image"
import { getRedisClient, CACHE_KEYS } from "../lib/redis"
import { uploadToBlob } from "../lib/blob-storage"

const execAsync = promisify(exec)
const logger = createLogger("Scheduler")

interface Schedule {
  id: string
  date: string
  time: string
  frequency: string
  status: string
  type?: string
  lastRun?: string
  productCount?: number
  generatedCards?: string[]
  errors?: string[]
}

interface ProductData {
  itemId: string
  productName: string
  imageUrl: string
  price: string
  sales: string
  ratingStar?: string
}

/**
 * Fetch products from API or cache
 */
async function fetchProducts(): Promise<ProductData[]> {
  try {
    logger.info("Fetching products...")

    // First try to fetch from Shopee API
    try {
      const shopeeResponse = await fetch("http://localhost:3000/api/fetch-shopee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: "trending", limit: 5 }),
      })

      if (shopeeResponse.ok) {
        const shopeeData = await shopeeResponse.json()
        if (shopeeData.success && shopeeData.products && shopeeData.products.length > 0) {
          logger.info(`Successfully fetched ${shopeeData.products.length} products from Shopee API`)
          return shopeeData.products
        }
      }
    } catch (error) {
      logger.warn("Failed to fetch from Shopee API, falling back to cache", error)
    }

    // Fallback to cached products
    logger.info("Falling back to cached products...")
    try {
      const redis = getRedisClient()
      const cachedProducts = await redis.get(CACHE_KEYS.PRODUCTS)

      if (cachedProducts) {
        const products = typeof cachedProducts === "string" ? JSON.parse(cachedProducts) : cachedProducts
        if (Array.isArray(products) && products.length > 0) {
          logger.info(`Successfully fetched ${products.length} products from cache`)
          return products
        }
      }
    } catch (redisError) {
      logger.error("Error accessing Redis cache:", redisError)
    }

    // If all else fails, return empty array
    logger.error("Failed to fetch products from all sources")
    return []
  } catch (error) {
    logger.error("Error fetching products:", error)
    return []
  }
}

/**
 * Generate a product card and upload to Blob Storage
 */
async function generateProductCard(
  product: ProductData,
  templateType = "portrait",
): Promise<{ success: boolean; filePath?: string; blobUrl?: string; error?: string }> {
  try {
    logger.info(
      `Generating card for product: ${product.itemId} - ${product.productName} with template: ${templateType}`,
    )

    // Generate a unique filename
    const timestamp = Date.now()
    const filename = `product-${product.itemId}-${templateType}-${timestamp}.png`

    // Generate description
    const description = await getCachedOrGenerateDescription(product)

    // Render HTML template
    const htmlTemplate = renderProductCardTemplate(product, description, templateType)

    if (!htmlTemplate) {
      throw new Error("Failed to render HTML template")
    }

    // Convert HTML to image
    const imageBuffer = await html2image(htmlTemplate, {
      width: 1080,
      height: 1920,
      quality: 90,
      format: "png",
    })

    // Upload to Blob Storage
    const blobUrl = await uploadToBlob(imageBuffer, filename)

    if (blobUrl) {
      logger.info(`Card uploaded to Blob Storage: ${blobUrl}`)
      return { success: true, blobUrl, filePath: filename }
    } else {
      throw new Error("Failed to upload to Blob Storage")
    }
  } catch (error: any) {
    logger.error(`Error generating card for product ${product.itemId}:`, error)
    return { success: false, error: error.message || "Unknown error" }
  }
}

/**
 * Get cached description or generate a new one
 */
async function getCachedOrGenerateDescription(product: ProductData): Promise<string> {
  try {
    const redis = getRedisClient()
    const cachedDescription = await redis.get(`${CACHE_KEYS.DESCRIPTION_PREFIX}${product.itemId}`)

    if (cachedDescription) {
      logger.info(`Using cached description for product ${product.itemId}`)
      return String(cachedDescription)
    }

    // Generate fallback description
    const description = createFallbackDescription(product)

    // Cache the description for future use
    await redis.set(`${CACHE_KEYS.DESCRIPTION_PREFIX}${product.itemId}`, description, { ex: 60 * 60 * 24 * 7 }) // 7 days

    return description
  } catch (error) {
    logger.error(`Error getting/generating description for product ${product.itemId}:`, error)
    return createFallbackDescription(product)
  }
}

/**
 * Process an auto-download schedule
 */
async function processAutoDownloadSchedule(schedule: Schedule): Promise<void> {
  try {
    logger.info(`Processing auto-download schedule: ${schedule.id}`)

    // Fetch products
    const products = await fetchProducts()

    if (products.length === 0) {
      throw new Error("No products found to process")
    }

    schedule.productCount = products.length
    logger.info(`Processing ${products.length} products for auto-download schedule ${schedule.id}`)

    // Select a random product
    const randomIndex = Math.floor(Math.random() * products.length)
    const product = products[randomIndex]

    // Generate cards with different templates
    const modernResult = await generateProductCard(product, "portrait")
    const ageminiResult = await generateProductCard(product, "ageminipara")

    // Initialize arrays if they don't exist
    schedule.generatedCards = schedule.generatedCards || []
    schedule.errors = schedule.errors || []

    // Track results
    if (modernResult.success && modernResult.blobUrl) {
      schedule.generatedCards.push(modernResult.blobUrl)
    } else if (modernResult.error) {
      schedule.errors.push(`Error generating modern card: ${modernResult.error}`)
    }

    if (ageminiResult.success && ageminiResult.blobUrl) {
      schedule.generatedCards.push(ageminiResult.blobUrl)
    } else if (ageminiResult.error) {
      schedule.errors.push(`Error generating agemini card: ${ageminiResult.error}`)
    }

    logger.info(
      `Auto-download schedule ${schedule.id} processed with ${schedule.generatedCards.length} cards generated`,
    )
  } catch (error: any) {
    logger.error(`Error processing auto-download schedule ${schedule.id}:`, error)
    schedule.errors = schedule.errors || []
    schedule.errors.push(`Auto-download error: ${error.message || "Unknown error"}`)
  }
}

/**
 * Main function
 */
async function main() {
  try {
    logger.info("Starting scheduler...")

    let schedules: Schedule[] = []

    try {
      // Get schedules from Redis
      const redis = getRedisClient()
      const schedulesData = await redis.get(CACHE_KEYS.SCHEDULES)

      if (schedulesData) {
        schedules = typeof schedulesData === "string" ? JSON.parse(schedulesData) : schedulesData
        logger.info(`Found ${schedules.length} schedules in Redis`)
      } else {
        logger.info("No schedules found in Redis")
      }
    } catch (error) {
      logger.error("Error accessing Redis:", error)
      return
    }

    if (schedules.length === 0) {
      logger.info("No schedules found")
      return
    }

    // Get current date and time
    const now = new Date()

    // Check for schedules that need to be executed
    const schedulesToExecute = schedules.filter((schedule: Schedule) => {
      if (schedule.status !== "pending") {
        return false
      }

      const scheduleDate = new Date(`${schedule.date}T${schedule.time}:00`)
      const scheduleTimestamp = scheduleDate.getTime()
      const nowTimestamp = now.getTime()

      // Execute if the schedule time is in the past
      return scheduleTimestamp <= nowTimestamp
    })

    if (schedulesToExecute.length === 0) {
      logger.info("No schedules to execute at this time")
      return
    }

    logger.info(`Found ${schedulesToExecute.length} schedules to execute`)

    // Execute each schedule
    for (const schedule of schedulesToExecute) {
      logger.info(`Executing schedule: ${schedule.id}`)

      // Initialize tracking properties if they don't exist
      schedule.lastRun = now.toISOString()
      schedule.productCount = 0
      schedule.generatedCards = schedule.generatedCards || []
      schedule.errors = schedule.errors || []

      try {
        // Check schedule type and process accordingly
        if (schedule.type === "auto-download") {
          await processAutoDownloadSchedule(schedule)
        } else {
          // For regular schedules, use the existing process
          // Fetch products
          const products = await fetchProducts()

          if (products.length === 0) {
            throw new Error("No products found to process")
          }

          schedule.productCount = products.length
          logger.info(`Processing ${products.length} products for schedule ${schedule.id}`)

          // Generate cards for each product
          for (const product of products) {
            const result = await generateProductCard(product)

            if (result.success && result.blobUrl) {
              schedule.generatedCards.push(result.blobUrl)
              logger.info(`Added card URL to schedule results: ${result.blobUrl}`)
            } else if (result.error) {
              schedule.errors.push(`Error generating card for product ${product.itemId}: ${result.error}`)
              logger.error(`Failed to generate card for product ${product.itemId}: ${result.error}`)
            }
          }

          // Update schedule status based on results
          if (schedule.generatedCards.length > 0) {
            logger.info(`Successfully generated ${schedule.generatedCards.length} cards for schedule ${schedule.id}`)
          } else {
            logger.error(`Failed to generate any cards for schedule ${schedule.id}`)
            schedule.errors.push("Failed to generate any cards")
          }
        }
      } catch (error: any) {
        logger.error(`Error executing schedule ${schedule.id}:`, error)
        schedule.errors.push(`Execution error: ${error.message || "Unknown error"}`)
      }

      // Update schedule status
      if (schedule.frequency === "once") {
        schedule.status = "completed"
      } else {
        // For recurring schedules, calculate the next execution date
        const scheduleDate = new Date(`${schedule.date}T${schedule.time}:00`)

        if (schedule.frequency === "daily") {
          scheduleDate.setDate(scheduleDate.getDate() + 1)
        } else if (schedule.frequency === "weekly") {
          scheduleDate.setDate(scheduleDate.getDate() + 7)
        }

        schedule.date = scheduleDate.toISOString().split("T")[0]
      }
    }

    // Update schedules in Redis
    try {
      const redis = getRedisClient()
      await redis.set(CACHE_KEYS.SCHEDULES, JSON.stringify(schedules))
      logger.info("Updated schedules in Redis")
    } catch (error) {
      logger.error("Error updating Redis:", error)
    }

    logger.info("Scheduler execution completed successfully!")
  } catch (error) {
    logger.error("Error in scheduler execution:", error)
  }
}

// Execute main function
main()
