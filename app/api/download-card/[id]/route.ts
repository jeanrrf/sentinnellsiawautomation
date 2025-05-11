import { type NextRequest, NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"
import { generateProductCard, generateAlternativeCard } from "@/lib/canvas-card-generator"
import { getCachedProducts } from "@/lib/redis"
import { createFallbackDescription } from "@/lib/card-generation-service"

const logger = createLogger("API:DownloadCard")

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const productId = params.id
    const { searchParams } = new URL(req.url)
    const format = searchParams.get("format") || "png"
    const template = searchParams.get("template") || "modern"

    logger.info(`Card download request received for product ${productId}`, { format, template })

    // Validar formato
    if (format !== "png" && format !== "jpeg") {
      logger.warn(`Invalid format: ${format}`)
      return NextResponse.json(
        {
          success: false,
          message: "Invalid format. Supported formats: png, jpeg",
        },
        { status: 400 },
      )
    }

    // Validar template
    if (!["modern", "bold", "minimal", "ageminipara", "portrait"].includes(template)) {
      logger.warn(`Invalid template: ${template}`)
      return NextResponse.json(
        {
          success: false,
          message: "Invalid template. Supported templates: modern, bold, minimal, ageminipara, portrait",
        },
        { status: 400 },
      )
    }

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

    // Gerar card com base no template
    let cardBlob: Blob
    const config = {
      format: format as "png" | "jpeg",
      template: template as any,
      quality: format === "jpeg" ? 0.9 : undefined,
    }

    if (template === "bold" || template === "minimal") {
      cardBlob = await generateAlternativeCard(product, description, config)
    } else {
      cardBlob = await generateProductCard(product, description, config)
    }

    // Converter blob para array buffer
    const arrayBuffer = await cardBlob.arrayBuffer()

    // Determinar o tipo MIME correto
    const contentType = format === "png" ? "image/png" : "image/jpeg"

    // Definir nome do arquivo para download
    const filename = `product_${productId}_${template}.${format}`

    // Retornar a imagem como resposta
    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    logger.error("Error in card download:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate card",
        error: error.message,
      },
      { status: 500 },
    )
  }
}
