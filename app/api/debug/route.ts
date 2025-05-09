import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import crypto from "crypto"

// Shopee API credentials from environment variables
const SHOPEE_APP_ID = process.env.SHOPEE_APP_ID
const SHOPEE_APP_SECRET = process.env.SHOPEE_APP_SECRET
const SHOPEE_AFFILIATE_API_URL = process.env.SHOPEE_AFFILIATE_API_URL

function generateSignature(appId: string, timestamp: number, payload: string, secret: string) {
  const baseString = `${appId}${timestamp}${payload}${secret}`
  return crypto.createHash("sha256").update(baseString).digest("hex")
}

export async function GET() {
  try {
    // Check environment variables
    const envCheck = {
      SHOPEE_APP_ID: !!SHOPEE_APP_ID,
      SHOPEE_APP_SECRET: !!SHOPEE_APP_SECRET,
      SHOPEE_AFFILIATE_API_URL: !!SHOPEE_AFFILIATE_API_URL,
      GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
    }

    // Check database directory
    const dataDir = path.join(process.cwd(), "database")
    const dbStatus = {
      dirExists: false,
      files: [],
      sampleData: null,
    }

    if (fs.existsSync(dataDir)) {
      dbStatus.dirExists = true
      dbStatus.files = fs.readdirSync(dataDir)

      // Check if we have any product files
      const productFiles = dbStatus.files.filter((f) => f.startsWith("top5_sellers_"))
      if (productFiles.length > 0) {
        const latestFile = path.join(dataDir, productFiles[productFiles.length - 1])
        try {
          const data = JSON.parse(fs.readFileSync(latestFile, "utf-8"))
          dbStatus.sampleData = {
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
          dbStatus.sampleData = { error: "Failed to parse JSON" }
        }
      }
    }

    // Try to fetch a sample from Shopee API
    let apiTest = { attempted: false }

    if (SHOPEE_APP_ID && SHOPEE_APP_SECRET && SHOPEE_AFFILIATE_API_URL) {
      apiTest.attempted = true

      const timestamp = Math.floor(Date.now() / 1000)
      const query = `
        query GetBestSellers($page: Int!, $limit: Int!, $sortType: Int) {
          productOfferV2(page: $page, limit: $limit, sortType: $sortType) {
            nodes {
              productName
              itemId
            }
          }
        }
      `
      const variables = { page: 1, limit: 1, sortType: 2 }
      const payload = JSON.stringify({ query, variables })
      const signature = generateSignature(SHOPEE_APP_ID, timestamp, payload, SHOPEE_APP_SECRET)

      const headers = {
        Authorization: `SHA256 Credential=${SHOPEE_APP_ID}, Timestamp=${timestamp}, Signature=${signature}`,
        "Content-Type": "application/json",
      }

      try {
        const response = await fetch(SHOPEE_AFFILIATE_API_URL, {
          method: "POST",
          headers,
          body: payload,
        })

        if (!response.ok) {
          apiTest = {
            ...apiTest,
            success: false,
            status: response.status,
            statusText: response.statusText,
            error: "API request failed",
          }
        } else {
          const data = await response.json()
          apiTest = {
            ...apiTest,
            success: true,
            data: data?.data?.productOfferV2?.nodes || [],
          }

          // If we got data but don't have a database file, create one
          if (data?.data?.productOfferV2?.nodes && (!dbStatus.sampleData || dbStatus.sampleData.productCount === 0)) {
            if (!fs.existsSync(dataDir)) {
              fs.mkdirSync(dataDir, { recursive: true })
            }

            const fileTimestamp = new Date().toISOString().replace(/[:.]/g, "").slice(0, 15)
            const filePath = path.join(dataDir, `top5_sellers_${fileTimestamp}.json`)

            fs.writeFileSync(
              filePath,
              JSON.stringify(
                {
                  success: true,
                  total: data.data.productOfferV2.nodes.length,
                  best_sellers: data.data.productOfferV2.nodes,
                },
                null,
                2,
              ),
            )

            apiTest.fileSaved = filePath
          }
        }
      } catch (error: any) {
        apiTest = {
          ...apiTest,
          success: false,
          error: error.message || "Unknown error",
        }
      }
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: envCheck,
      database: dbStatus,
      apiTest,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Unknown error",
      },
      { status: 500 },
    )
  }
}
