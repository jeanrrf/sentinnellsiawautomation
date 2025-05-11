import { type NextRequest, NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"
import { generateProductCard, generateAlternativeCard } from "@/lib/canvas-card-generator"
import { getCachedProducts } from "@/lib/redis"
import { createFallbackDescription } from "@/lib/card-generation-service"
import JSZip from "jszip"

const logger = createLogger("API:DownloadCardPackage")

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const productId = params.id
    logger.info(`Card package download request received for product ${productId}`)

    // Buscar produto do cache
    const products = await getCachedProducts()

    if (!products || !Array.isArray(products) || products.length === 0) {
      logger.error("No products found in cache")
      return NextResponse.json(
        {
          success: false,
          message: "No products found in cache",
        },
        { status: 404 },
      )
    }

    // Encontrar o produto pelo ID
    const product = products.find((p) => p.itemId === productId)

    if (!product) {
      logger.error(`Product with ID ${productId} not found`)
      return NextResponse.json(
        {
          success: false,
          message: `Product with ID ${productId} not found`,
        },
        { status: 404 },
      )
    }

    // Tentar obter descrição da API ou usar fallback
    let description = ""
    try {
      const descResponse = await fetch(`${req.nextUrl.origin}/api/generate-description`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ product }),
      })

      if (descResponse.ok) {
        const descData = await descResponse.json()
        if (descData.success) {
          description = descData.description
        } else {
          throw new Error(descData.error || "Failed to generate description")
        }
      } else {
        throw new Error(`API returned ${descResponse.status}`)
      }
    } catch (error) {
      logger.warn("Failed to generate description, using fallback", { error })
      description = createFallbackDescription(product)
    }

    // Gerar cards em diferentes formatos
    const modernPngBlob = await generateProductCard(product, description, {
      format: "png",
      template: "modern",
    })

    const modernJpegBlob = await generateProductCard(product, description, {
      format: "jpeg",
      template: "modern",
      quality: 0.9,
    })

    const boldPngBlob = await generateAlternativeCard(product, description, {
      format: "png",
      template: "bold",
    })

    const boldJpegBlob = await generateAlternativeCard(product, description, {
      format: "jpeg",
      template: "bold",
      quality: 0.9,
    })

    // Criar arquivo de texto com informações do produto
    const textContent = `
Product: ${product.productName}
ID: ${product.itemId}
Price: R$ ${Number(product.price).toFixed(2)}
${product.calculatedOriginalPrice ? `Original Price: R$ ${product.calculatedOriginalPrice}` : ""}
Discount: ${product.priceDiscountRate || "0"}%
Shop: ${product.shopName || "Unknown"}
Sales: ${product.sales}
Rating: ${product.ratingStar || "N/A"}

Description:
${description}

Link: ${product.offerLink || "N/A"}
    `.trim()

    const textBlob = new Blob([textContent], { type: "text/plain" })

    // Criar ZIP
    const zip = new JSZip()
    zip.file(`product_${productId}_modern.png`, modernPngBlob)
    zip.file(`product_${productId}_modern.jpg`, modernJpegBlob)
    zip.file(`product_${productId}_bold.png`, boldPngBlob)
    zip.file(`product_${productId}_bold.jpg`, boldJpegBlob)
    zip.file(`product_${productId}_info.txt`, textBlob)

    // Gerar o arquivo ZIP
    const zipBlob = await zip.generateAsync({ type: "blob" })
    const zipBuffer = await zipBlob.arrayBuffer()

    // Retornar o ZIP como resposta
    return new NextResponse(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="product_${productId}_package.zip"`,
      },
    })
  } catch (error) {
    logger.error("Error in card package download:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate card package",
        error: error.message,
      },
      { status: 500 },
    )
  }
}
