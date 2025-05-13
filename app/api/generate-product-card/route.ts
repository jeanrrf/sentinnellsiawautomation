import { type NextRequest, NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"
import { renderProductCardTemplate } from "@/lib/template-renderer"

const logger = createLogger("generate-product-card-api")

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json()

    // Extract data with proper validation
    const productId = body.productId
    const useAI = body.useAI ?? true
    const customDescription = body.customDescription || ""
    const style = body.style || "portrait"

    logger.info("Request received", {
      context: { productId, useAI, hasCustomDescription: !!customDescription, style },
    })

    // Fetch the product data if only ID is provided
    let product = body.product

    if (!product && productId) {
      logger.info(`Fetching product data for ID: ${productId}`)
      try {
        // Fetch product data from the products API
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

        product = productData.products?.find((p) => p.itemId === productId)

        if (!product) {
          throw new Error(`Produto com ID ${productId} não encontrado`)
        }
      } catch (fetchError: any) {
        logger.error("Error fetching product data", {
          details: fetchError,
          context: { productId, error: fetchError.message },
        })
        return NextResponse.json(
          {
            success: false,
            error: "Erro ao buscar dados do produto",
            details: fetchError.message,
            message: "AVISO: Não foi possível obter os dados do produto. Verifique se o ID do produto está correto.",
          },
          { status: 500 },
        )
      }
    }

    // Validate that we have a product
    if (!product) {
      logger.warn("No product data provided", { context: { body: JSON.stringify(body) } })
      return NextResponse.json(
        {
          success: false,
          error: "Dados do produto não fornecidos",
          message: "AVISO: Nenhum dado de produto foi fornecido. Selecione um produto válido.",
        },
        { status: 400 },
      )
    }

    // Generate description if needed
    let description = customDescription

    if (useAI && !description) {
      try {
        logger.info("Generating AI description")
        const descResponse = await fetch(`${request.nextUrl.origin}/api/generate-description`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product }),
        })

        if (!descResponse.ok) {
          throw new Error(`Falha ao gerar descrição: ${descResponse.status}`)
        }

        const descData = await descResponse.json()

        if (!descData.success) {
          throw new Error(descData.error || "Erro desconhecido ao gerar descrição")
        }

        description = descData.description
      } catch (descError: any) {
        logger.warn("Failed to generate AI description, using fallback", {
          details: descError,
        })

        // Criar uma descrição básica em vez de usar uma descrição simulada
        description = `AVISO: Não foi possível gerar uma descrição com IA.
       
${product.productName}
Preço: R$ ${Number(product.price).toFixed(2)}
Vendas: ${product.sales || 0}+

#oferta #shopee`
      }
    }

    // Generate HTML for the product card
    logger.info("Generating product card HTML")
    const html = renderProductCardTemplate(product, description, style)

    // Return the response
    return NextResponse.json({
      success: true,
      html,
      productId: product.itemId,
      template: style,
    })
  } catch (error: any) {
    // Log the error with detailed information
    logger.error("Error generating product card", {
      details: error,
      context: {
        error: error.message,
        stack: error.stack,
      },
    })

    // Return an error response
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao gerar card do produto",
        details: error.message,
        message: "AVISO: Ocorreu um erro ao gerar o card do produto. Por favor, tente novamente.",
      },
      { status: 500 },
    )
  }
}
