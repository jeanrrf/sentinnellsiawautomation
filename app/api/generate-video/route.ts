import { NextResponse } from "next/server"
import { isIdProcessed, addProcessedId, getCachedDescription } from "@/lib/redis"
import { renderProductCardTemplate } from "@/lib/template-renderer"
import { ErrorType, createAppError, handleError } from "@/lib/error-handling"

export async function POST(req: Request) {
  try {
    const { productId, useAI, customDescription, videoStyle } = await req.json()

    if (!productId) {
      const error = createAppError(ErrorType.VALIDATION, "ID do produto é obrigatório", { code: "MISSING_PRODUCT_ID" })

      return NextResponse.json({ success: false, message: error.message, error }, { status: 400 })
    }

    console.log("Iniciando geração de vídeo com parâmetros:", {
      productId,
      useAI,
      customDescription: customDescription ? `${customDescription.substring(0, 20)}...` : undefined,
      videoStyle,
    })

    console.log(`Generating video for product ID: ${productId}, useAI: ${useAI}, style: ${videoStyle}`)

    // Check if this product ID has already been processed
    let processed = false
    try {
      processed = await isIdProcessed(productId)
      console.log(`Product ${productId} processed status:`, processed)
    } catch (error) {
      // Usar nosso sistema de tratamento de erros
      handleError(error, {
        context: "generate-video",
        operation: "check-processed-id",
        productId,
      })
      // Continue even if this check fails
    }

    // Get product data from the products API
    let product = null
    try {
      // Use a direct approach to get the product data
      const productsResponse = await fetch(new URL("/api/products", req.url).toString())

      if (!productsResponse.ok) {
        throw createAppError(
          ErrorType.API_RESPONSE,
          `Falha ao buscar produtos: ${productsResponse.status} ${productsResponse.statusText}`,
          {
            code: productsResponse.status.toString(),
            details: { status: productsResponse.status, statusText: productsResponse.statusText },
          },
        )
      }

      const productsData = await productsResponse.json()
      product = productsData.products.find((p: any) => p.itemId === productId)

      if (!product) {
        throw createAppError(ErrorType.VALIDATION, "Produto não encontrado na lista de produtos", {
          code: "PRODUCT_NOT_FOUND",
          details: { productId },
        })
      }
    } catch (error) {
      const appError = error.type
        ? error
        : createAppError(ErrorType.API_REQUEST, `Falha ao buscar produto: ${error.message}`, {
            originalError: error,
            details: { productId },
          })

      handleError(appError, {
        context: "generate-video",
        operation: "fetch-product",
        productId,
      })

      return NextResponse.json(
        {
          success: false,
          message: appError.message,
          error: appError,
        },
        { status: 500 },
      )
    }

    // Get or generate description
    let description = customDescription
    let descriptionSource = "custom"
    console.log("Custom description:", customDescription)

    // If using AI, try to get a description
    if (useAI) {
      try {
        // First try to get cached description
        try {
          const cachedDescription = await getCachedDescription(productId)
          if (cachedDescription) {
            description = cachedDescription
            descriptionSource = "cache"
            console.log("Using cached description for product:", productId)
          }
        } catch (cacheError) {
          handleError(cacheError, {
            context: "generate-video",
            operation: "get-cached-description",
            productId,
          })
        }

        // If no cached description, try to generate one
        if (!description) {
          try {
            const descResponse = await fetch(new URL("/api/generate-description", req.url).toString(), {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ product }),
            })

            if (!descResponse.ok) {
              throw createAppError(ErrorType.API_RESPONSE, `Falha ao gerar descrição: ${descResponse.status}`, {
                code: descResponse.status.toString(),
                details: { status: descResponse.status, statusText: descResponse.statusText },
              })
            }

            const descData = await descResponse.json()
            if (descData.success) {
              description = descData.description
              descriptionSource = descData.source || "api"
              console.log("Generated description:", description)
            } else {
              throw createAppError(ErrorType.API_RESPONSE, descData.message || "Falha ao gerar descrição", {
                details: descData,
              })
            }
          } catch (error) {
            handleError(error, {
              context: "generate-video",
              operation: "generate-description",
              productId,
            })
            // Fallback description
            description = createFallbackDescription(product)
            descriptionSource = "fallback"
          }
        }
      } catch (error) {
        handleError(error, {
          context: "generate-video",
          operation: "description-handling",
          productId,
        })
        // Fallback description if all else fails
        description = createFallbackDescription(product)
        descriptionSource = "fallback"
      }
    }

    if (!description) {
      description = createFallbackDescription(product)
      descriptionSource = "fallback"
    }

    console.log("Final description:", description)

    // Generate HTML template
    const htmlTemplate = renderProductCardTemplate(product, description, videoStyle)

    // Verificar se o htmlTemplate foi gerado corretamente
    if (!htmlTemplate || htmlTemplate.trim() === "") {
      console.error("HTML Template vazio ou inválido")
      return NextResponse.json(
        {
          success: false,
          message: "Falha ao gerar o HTML do card. Template vazio ou inválido.",
        },
        { status: 500 },
      )
    }

    console.log("HTML Template gerado com sucesso. Tamanho:", htmlTemplate.length)

    // Mark the product ID as processed (but don't fail if this doesn't work)
    try {
      await addProcessedId(productId)
    } catch (error) {
      handleError(error, {
        context: "generate-video",
        operation: "mark-processed",
        productId,
      })
      // Continue even if this fails
    }

    // Return the HTML template and other data
    return NextResponse.json({
      success: true,
      htmlTemplate,
      description,
      descriptionSource,
      product,
      previewUrl: `/api/preview/${productId}?style=${videoStyle}`,
      style: videoStyle,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("Erro detalhado na geração de vídeo:", error)
    console.error("Stack trace:", error.stack)

    // Tentar extrair mais informações do erro
    const errorDetails = {
      message: error.message,
      name: error.name,
      stack: error.stack,
      code: error.code,
    }

    console.error("Detalhes do erro:", JSON.stringify(errorDetails, null, 2))

    return NextResponse.json(
      {
        success: false,
        message: `Falha ao gerar vídeo: ${error.message}`,
        errorDetails: errorDetails,
      },
      { status: 500 },
    )
  }
}

// Fallback description generator
function createFallbackDescription(product: any) {
  const price = Number.parseFloat(product.price)
  const stars = Number.parseFloat(product.ratingStar || "4.5")
  const sales = Number.parseInt(product.sales)

  // Criar uma descrição curta e direta
  const urgency = sales > 1000 ? "🔥 OFERTA IMPERDÍVEL!" : "⚡ PROMOÇÃO!"
  const rating = "⭐".repeat(Math.min(Math.round(stars), 5))

  // Limitar o nome do produto a 30 caracteres
  const shortName = product.productName.length > 30 ? product.productName.substring(0, 30) + "..." : product.productName

  return `${urgency}\n${shortName}\n${rating}\nApenas R$${price.toFixed(2)}\nJá vendidos: ${sales}\n#oferta #shopee`
}
