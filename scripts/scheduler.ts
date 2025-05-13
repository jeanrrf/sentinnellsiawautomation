import fs from "fs"
import path from "path"
import { exec } from "child_process"
import { promisify } from "util"
import fetch from "node-fetch"
import { createLogger } from "../lib/logger"
import { renderProductCardTemplate } from "../lib/template-renderer"
import { createFallbackDescription } from "../lib/template-renderer"
import { html2image } from "../lib/html-to-image"

const execAsync = promisify(exec)
const logger = createLogger("Scheduler")

interface Schedule {
  id: string
  date: string
  time: string
  frequency: string
  status: string
  type?: string // New field to distinguish between regular and auto-download schedules
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

async function fetchProducts(): Promise<ProductData[]> {
  try {
    logger.info("Fetching products from API...")

    // First try to fetch from Shopee API
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

    // Fallback to cached products
    logger.info("Falling back to cached products...")
    const cachedResponse = await fetch("http://localhost:3000/api/products")

    if (cachedResponse.ok) {
      const cachedData = await cachedResponse.json()
      if (cachedData.success && cachedData.products && cachedData.products.length > 0) {
        logger.info(`Successfully fetched ${cachedData.products.length} products from cache`)
        return cachedData.products
      }
    }

    // If all else fails, return empty array
    logger.error("Failed to fetch products from all sources")
    return []
  } catch (error) {
    logger.error("Error fetching products:", error)
    return []
  }
}

// Modificar a função generateProductCard para usar Blob Storage
async function generateProductCard(
  product: ProductData,
  templateType = "portrait",
): Promise<{ success: boolean; filePath?: string; blobUrl?: string; error?: string }> {
  try {
    logger.info(
      `Generating card for product: ${product.itemId} - ${product.productName} with template: ${templateType}`,
    )

    // Verificar se estamos no Vercel
    const isVercel = process.env.VERCEL === "1"

    // Create temp directory if it doesn't exist (for local development)
    const tempDir = path.join(process.cwd(), "tmp")
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    // Generate a unique filename
    const timestamp = new Date().getTime()
    const filename = `product-${product.itemId}-${templateType}-${timestamp}.png`
    const outputPath = path.join(tempDir, filename)

    // Generate description
    const description = createFallbackDescription(product)

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

    // Em produção, salvar no Blob Storage
    if (isVercel) {
      try {
        // Import dinamicamente para evitar erros em ambiente de desenvolvimento
        const { put } = await import("@vercel/blob")
        const blob = await put(filename, imageBuffer, {
          access: "public",
        })

        logger.info(`Card uploaded to Blob Storage: ${blob.url}`)
        return { success: true, blobUrl: blob.url, filePath: filename }
      } catch (blobError) {
        logger.error("Error uploading to Blob Storage:", blobError)
        // Fallback para sistema de arquivos local
        fs.writeFileSync(outputPath, imageBuffer)
        return { success: true, filePath: outputPath }
      }
    } else {
      // Em desenvolvimento, salvar localmente
      fs.writeFileSync(outputPath, imageBuffer)
      logger.info(`Card generated successfully: ${outputPath}`)
      return { success: true, filePath: outputPath }
    }
  } catch (error) {
    logger.error(`Error generating card for product ${product.itemId}:`, error)
    return { success: false, error: error.message || "Unknown error" }
  }
}

// Function to handle auto-download schedules
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

    // Track results
    if (modernResult.success) {
      if (modernResult.blobUrl) {
        schedule.generatedCards.push(modernResult.blobUrl)
      } else if (modernResult.filePath) {
        schedule.generatedCards.push(modernResult.filePath)
      }
    } else if (modernResult.error) {
      schedule.errors.push(`Error generating modern card: ${modernResult.error}`)
    }

    if (ageminiResult.success) {
      if (ageminiResult.blobUrl) {
        schedule.generatedCards.push(ageminiResult.blobUrl)
      } else if (ageminiResult.filePath) {
        schedule.generatedCards.push(ageminiResult.filePath)
      }
    } else if (ageminiResult.error) {
      schedule.errors.push(`Error generating agemini card: ${ageminiResult.error}`)
    }

    logger.info(
      `Auto-download schedule ${schedule.id} processed with ${schedule.generatedCards.length} cards generated`,
    )
  } catch (error) {
    logger.error(`Error processing auto-download schedule ${schedule.id}:`, error)
    schedule.errors.push(`Auto-download error: ${error.message || "Unknown error"}`)
  }
}

// Modificar a função main para usar Redis em produção
async function main() {
  try {
    logger.info("Starting scheduler...")

    // Verificar se estamos no Vercel
    const isVercel = process.env.VERCEL === "1"
    let schedules: Schedule[] = []

    // Obter agendamentos
    if (isVercel) {
      try {
        // Em produção, usar Redis
        const { Redis } = await import("@upstash/redis")
        const redis = Redis.fromEnv()
        const schedulesData = await redis.get("schedules")
        schedules = schedulesData ? JSON.parse(schedulesData) : []
        logger.info(`Found ${schedules.length} schedules in Redis`)
      } catch (redisError) {
        logger.error("Error accessing Redis:", redisError)
        return
      }
    } else {
      // Em desenvolvimento, usar sistema de arquivos
      const schedulesPath = path.join(process.cwd(), "database", "schedules.json")

      if (!fs.existsSync(schedulesPath)) {
        logger.info("No schedules found")
        return
      }

      const rawData = fs.readFileSync(schedulesPath, "utf-8")
      const data = JSON.parse(rawData)
      schedules = data.schedules || []
    }

    if (schedules.length === 0) {
      logger.info("No schedules found")
      return
    }

    // Get current date and time
    const now = new Date()
    const currentDate = now.toISOString().split("T")[0]
    const currentTime = now.toTimeString().split(" ")[0].substring(0, 5)

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

            if (result.success) {
              if (result.blobUrl) {
                schedule.generatedCards.push(result.blobUrl)
                logger.info(`Added card URL to schedule results: ${result.blobUrl}`)
              } else if (result.filePath) {
                schedule.generatedCards.push(result.filePath)
                logger.info(`Added card path to schedule results: ${result.filePath}`)
              }
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
      } catch (error) {
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

    // Atualizar agendamentos
    if (isVercel) {
      try {
        // Em produção, atualizar no Redis
        const { Redis } = await import("@upstash/redis")
        const redis = Redis.fromEnv()
        await redis.set("schedules", JSON.stringify(schedules))
        logger.info("Updated schedules in Redis")
      } catch (redisError) {
        logger.error("Error updating Redis:", redisError)
      }
    } else {
      // Em desenvolvimento, atualizar no sistema de arquivos
      const schedulesPath = path.join(process.cwd(), "database", "schedules.json")
      fs.writeFileSync(schedulesPath, JSON.stringify({ schedules }, null, 2))
      logger.info("Updated schedules in file system")
    }

    logger.info("Scheduler execution completed successfully!")
  } catch (error) {
    logger.error("Error in scheduler execution:", error)
  }
}

main()
