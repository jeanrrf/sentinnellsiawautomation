import fs from "fs"
import path from "path"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

async function main() {
  try {
    console.log("Starting video generation process...")

    // 1. Fetch products from Shopee API
    console.log("Fetching products from Shopee API...")
    await execAsync("curl -X POST http://localhost:3000/api/fetch-shopee")

    // 2. Get the latest products file
    const dataDir = path.join(process.cwd(), "database")
    const files = fs
      .readdirSync(dataDir)
      .filter((file) => file.startsWith("top5_sellers_"))
      .sort()
      .reverse()

    if (files.length === 0) {
      throw new Error("No product files found")
    }

    const latestFile = path.join(dataDir, files[0])
    console.log(`Using latest product file: ${latestFile}`)

    const rawData = fs.readFileSync(latestFile, "utf-8")
    const data = JSON.parse(rawData)
    const products = data.best_sellers || []

    if (products.length === 0) {
      throw new Error("No products found in the latest file")
    }

    // 3. Generate videos for each product
    console.log(`Generating videos for ${products.length} products...`)

    for (const product of products) {
      console.log(`Generating video for product: ${product.productName}`)

      await execAsync(
        `curl -X POST http://localhost:3000/api/generate-video -H "Content-Type: application/json" -d '{"productId":"${product.itemId}","useAI":true,"videoStyle":"portrait"}'`,
      )

      console.log(`Video generated for product: ${product.itemId}`)
    }

    console.log("Video generation process completed successfully!")
  } catch (error) {
    console.error("Error in video generation process:", error)
    process.exit(1)
  }
}

main()
