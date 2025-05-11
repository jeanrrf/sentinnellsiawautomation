import { type NextRequest, NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"
import { renderProductCardTemplate } from "@/lib/template-renderer"
import puppeteer from "puppeteer"
import path from "path"
import fs from "fs"
import os from "os"

const logger = createLogger("preview-api")

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const productId = params.id
    const searchParams = request.nextUrl.searchParams
    const style = searchParams.get("style") || "portrait"

    logger.info(`Generating preview for product: ${productId} with style: ${style}`)

    // Fetch product data
    const productResponse = await fetch(`${request.nextUrl.origin}/api/products`, {
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!productResponse.ok) {
      throw new Error(`Falha ao buscar produtos: ${productResponse.status} ${productResponse.statusText}`)
    }

    const productData = await productResponse.json()

    if (!productData.success) {
      throw new Error(productData.error || "Erro desconhecido ao buscar produtos")
    }

    const product = productData.products?.find((p) => p.itemId === productId)

    if (!product) {
      throw new Error(`Produto com ID ${productId} não encontrado`)
    }

    // Generate description
    let description = ""
    try {
      const descResponse = await fetch(`${request.nextUrl.origin}/api/generate-description`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product }),
      })

      if (descResponse.ok) {
        const descData = await descResponse.json()
        if (descData.success) {
          description = descData.description
        }
      }
    } catch (descError) {
      logger.error("Error generating description:", descError)
      // Fallback to basic description
      description = `🔥 SUPER OFERTA! 🔥\n\n${product.productName}\n\n💰 Apenas R$${Number(product.price).toFixed(
        2,
      )}\n\n#oferta #shopee`
    }

    // Generate HTML
    const html = renderProductCardTemplate(product, description, style)

    // Determine dimensions based on style
    let width = 1080
    let height = 1920

    if (style === "square") {
      width = 1080
      height = 1080
    } else if (style === "landscape") {
      width = 1920
      height = 1080
    }

    // Generate image from HTML
    const imageBuffer = await generateImageFromHTML(html, width, height)

    // Return the image
    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  } catch (error: any) {
    logger.error("Error generating preview:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao gerar preview",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

async function generateImageFromHTML(html: string, width: number, height: number) {
  const tempDir = process.env.TEMP_DIR || os.tmpdir()
  const tempFilePath = path.join(tempDir, `preview-${Date.now()}.png`)

  try {
    // Launch browser
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      executablePath: process.env.CHROME_EXECUTABLE_PATH,
    })

    const page = await browser.newPage()
    await page.setViewport({ width, height, deviceScaleFactor: 2 })
    await page.setContent(html, { waitUntil: "networkidle0" })

    // Take screenshot
    const imageBuffer = await page.screenshot({ type: "png" })

    await browser.close()

    return imageBuffer
  } catch (error) {
    logger.error("Error generating image from HTML:", error)
    throw new Error("Falha ao gerar imagem do preview")
  } finally {
    // Clean up temp file if it exists
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath)
    }
  }
}
