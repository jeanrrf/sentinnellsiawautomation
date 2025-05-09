import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET() {
  try {
    // Collect system information
    const systemInfo = {
      timestamp: new Date().toISOString(),
      environment: {
        node: process.version,
        platform: process.platform,
        arch: process.arch,
        isVercel: process.env.VERCEL === "1",
      },
      env: {
        SHOPEE_APP_ID: !!process.env.SHOPEE_APP_ID,
        SHOPEE_APP_SECRET: !!process.env.SHOPEE_APP_SECRET,
        SHOPEE_AFFILIATE_API_URL: !!process.env.SHOPEE_AFFILIATE_API_URL,
        GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
      },
    }

    // Check if we're in Vercel environment
    const isVercel = process.env.VERCEL === "1"

    // Database status object
    let dbStatus = {
      dirExists: false,
      files: [],
      productFile: {
        exists: false,
        size: 0,
        lastModified: null,
        content: null,
      },
    }

    // Only try to access the file system if we're not in Vercel
    if (!isVercel) {
      try {
        // Check database
        const dataDir = path.join(process.cwd(), "database")

        if (fs.existsSync(dataDir)) {
          dbStatus.dirExists = true
          dbStatus.files = fs.readdirSync(dataDir)

          // Check product file
          const productFilePath = path.join(dataDir, "top5_sellers_20250508_170958.json")
          if (fs.existsSync(productFilePath)) {
            const stats = fs.statSync(productFilePath)
            dbStatus.productFile.exists = true
            dbStatus.productFile.size = stats.size
            dbStatus.productFile.lastModified = stats.mtime.toISOString()

            // Read file content
            try {
              const rawData = fs.readFileSync(productFilePath, "utf-8")
              const data = JSON.parse(rawData)
              dbStatus.productFile.content = {
                success: data.success,
                total: data.total,
                productCount: data.best_sellers?.length || 0,
                firstProduct: data.best_sellers?.[0]
                  ? {
                      itemId: data.best_sellers[0].itemId,
                      productName: data.best_sellers[0].productName,
                    }
                  : null,
              }
            } catch (e) {
              dbStatus.productFile.content = { error: `Failed to parse JSON: ${e.message}` }
            }
          }
        }
      } catch (fsError) {
        console.error("File system error:", fsError)
        dbStatus = {
          ...dbStatus,
          error: `File system error: ${fsError.message}`,
        }
      }
    } else {
      dbStatus = {
        ...dbStatus,
        note: "File system checks skipped in Vercel environment",
      }
    }

    // Test products API
    let productsApiTest = { attempted: false }
    try {
      productsApiTest.attempted = true

      // Use relative URL to avoid localhost issues in production
      const apiUrl = "/api/products"
      const response = await fetch(new URL(apiUrl, "https://example.com"))

      if (!response.ok) {
        productsApiTest = {
          ...productsApiTest,
          success: false,
          status: response.status,
          statusText: response.statusText,
        }
      } else {
        const data = await response.json()
        productsApiTest = {
          ...productsApiTest,
          success: true,
          productCount: data.products?.length || 0,
          firstProduct: data.products?.[0]
            ? {
                itemId: data.products[0].itemId,
                productName: data.products[0].productName,
              }
            : null,
        }
      }
    } catch (apiError) {
      productsApiTest = {
        ...productsApiTest,
        success: false,
        error: `API error: ${apiError.message}`,
      }
    }

    return NextResponse.json({
      systemInfo,
      database: dbStatus,
      productsApi: productsApiTest,
    })
  } catch (error) {
    console.error("System check error:", error)

    // Return a more detailed error response
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Unknown error",
        stack: process.env.NODE_ENV !== "production" ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
