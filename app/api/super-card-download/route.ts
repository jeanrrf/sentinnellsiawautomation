import { type NextRequest, NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"
import { getCachedProducts } from "@/lib/redis"
import { createFallbackDescription } from "@/lib/card-generation-service"
import JSZip from "jszip"
import { generateSearchStyleCard, generateAllCardStyles } from "@/lib/product-card-generator"

const logger = createLogger("API:SuperCardDownload")

export async function GET(req: NextRequest) {
  try {
    logger.info("Super card download request received")
    const { searchParams } = new URL(req.url)
    const productId = searchParams.get("productId")
    const darkMode = searchParams.get("darkMode") === "true"
    const allStyles = searchParams.get("allStyles") !== "false" // Por padrão, incluir todos os estilos

    // Obter produtos do cache
    const products = await getCachedProducts()
    let selectedProduct

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

    // Se um ID específico foi fornecido, buscar esse produto
    if (productId) {
      selectedProduct = products.find((p) => p.itemId === productId)
      if (!selectedProduct) {
        logger.warn(`Product with ID ${productId} not found, selecting random product`)
      }
    }

    // Se não encontrou o produto específico ou nenhum ID foi fornecido, selecionar aleatoriamente
    if (!selectedProduct) {
      const randomIndex = Math.floor(Math.random() * products.length)
      selectedProduct = products[randomIndex]
    }

    logger.info(`Selected product: ${selectedProduct.itemId} - ${selectedProduct.productName}`)

    // Gerar descrição
    let description = ""
    try {
      const descResponse = await fetch(`${req.nextUrl.origin}/api/generate-description`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ product: selectedProduct }),
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
      description = createFallbackDescription(selectedProduct)
    }

    // Gerar cards
    let cardBuffers: Record<string, Buffer> = {}

    if (allStyles) {
      // Gerar todos os estilos
      cardBuffers = await generateAllCardStyles(selectedProduct, description, darkMode)
    } else {
      // Gerar apenas o estilo da aba Busca
      const searchCardBuffer = await generateSearchStyleCard(selectedProduct, description, {
        darkMode,
        template: "search",
      })
      cardBuffers = { search: searchCardBuffer }
    }

    // Criar ZIP com todos os arquivos
    const zip = new JSZip()

    // Adicionar informações do produto em TXT
    const productInfo = `
Produto: ${selectedProduct.productName}
ID: ${selectedProduct.itemId}
Preço: R$ ${Number(selectedProduct.price).toFixed(2)}
${selectedProduct.priceDiscountRate ? `Desconto: ${selectedProduct.priceDiscountRate}%` : ""}
Vendas: ${selectedProduct.sales}
Avaliação: ${selectedProduct.ratingStar || "N/A"}

Descrição:
${description}

Link: ${selectedProduct.offerLink || "N/A"}
    `.trim()

    zip.file("produto_info.txt", productInfo)

    // Adicionar descrição separada
    zip.file("descricao.txt", description)

    // Adicionar imagens
    for (const [style, buffer] of Object.entries(cardBuffers)) {
      const filename = `card_${style}_${darkMode ? "dark" : "light"}.png`
      zip.file(filename, buffer)
    }

    // Gerar ZIP
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" })

    // Nome do arquivo
    const sanitizedName = selectedProduct.productName.substring(0, 30).replace(/[^a-zA-Z0-9]/g, "_")
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const filename = `cards_${sanitizedName}_${timestamp}.zip`

    // Retornar o ZIP para download
    return new NextResponse(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    logger.error("Error in super card download:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate cards",
        error: error.message,
      },
      { status: 500 },
    )
  }
}
