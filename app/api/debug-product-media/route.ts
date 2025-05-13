import { type NextRequest, NextResponse } from "next/server"
import { logger } from "@/lib/logger"
import { getShopeeService } from "@/lib/shopee-product-service"
import { shopeeWebAPI } from "@/lib/shopee-web-api"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const productId = searchParams.get("productId")
  const shopId = searchParams.get("shopId")
  const useWebApi = searchParams.get("webApi") === "true"
  const raw = searchParams.get("raw") === "true"

  if (!productId) {
    return NextResponse.json(
      {
        success: false,
        message: "ID do produto é obrigatório",
      },
      { status: 400 },
    )
  }

  try {
    logger.info(`Iniciando diagnóstico para o produto: ${productId}${shopId ? `, loja: ${shopId}` : ""}`)

    // Se solicitado apenas a resposta bruta da API
    if (raw) {
      if (useWebApi && shopId) {
        // Usar API não oficial
        const rawResponse = await shopeeWebAPI.getProductInfo(shopId, productId)
        return NextResponse.json(rawResponse)
      } else {
        // Usar API oficial
        const shopeeService = getShopeeService()
        if (!shopeeService) {
          return NextResponse.json(
            {
              success: false,
              message: "Serviço da Shopee não disponível - verifique as credenciais",
            },
            { status: 500 },
          )
        }

        const rawResponse = await shopeeService.getProductMedia(productId)
        return NextResponse.json(rawResponse)
      }
    }

    // Verificar variáveis de ambiente
    const envCheck = {
      SHOPEE_APP_ID: process.env.SHOPEE_APP_ID ? "✅ Configurado" : "❌ Não configurado",
      SHOPEE_APP_SECRET: process.env.SHOPEE_APP_SECRET ? "✅ Configurado" : "❌ Não configurado",
      SHOPEE_AFFILIATE_API_URL: process.env.SHOPEE_AFFILIATE_API_URL ? "✅ Configurado" : "❌ Não configurado",
      SHOPEE_AFFILIATE_ID: process.env.SHOPEE_AFFILIATE_ID ? "✅ Configurado" : "❌ Não configurado",
    }

    // Resultados do diagnóstico
    const diagnosticResults: any = {
      success: true,
      timestamp: new Date().toISOString(),
      productId,
      shopId: shopId || "Não fornecido",
      envCheck,
      apiType: useWebApi ? "shopee-web-api" : "shopee-affiliate-api",
      fallbackUsed: false,
    }

    try {
      // Testar API
      if (useWebApi && shopId) {
        // Usar API não oficial
        logger.info(`Testando API não oficial para produto ${productId}, loja ${shopId}`)
        const mediaData = await shopeeWebAPI.getProductImages(shopId, productId)

        diagnosticResults.apiResponse = {
          success: !mediaData.error,
          statusCode: 200,
          statusText: mediaData.error ? "Error" : "OK",
          parsed: mediaData,
        }

        diagnosticResults.processedData = {
          id: `media-${productId}`,
          productId,
          shopId,
          name: mediaData.name,
          images: mediaData.images,
          videos: mediaData.videos,
          source: "shopee-web-api",
        }

        if (mediaData.error) {
          diagnosticResults.success = false
          diagnosticResults.message = `Erro na API não oficial: ${mediaData.error}`
        }
      } else {
        // Usar API oficial
        logger.info(`Testando API oficial para produto ${productId}`)
        const shopeeService = getShopeeService()

        if (!shopeeService) {
          throw new Error("Serviço da Shopee não disponível - verifique as credenciais")
        }

        const mediaData = await shopeeService.getProductMedia(productId)

        diagnosticResults.apiResponse = {
          success: !mediaData.error,
          statusCode: 200,
          statusText: mediaData.error ? "Error" : "OK",
          parsed: mediaData,
        }

        diagnosticResults.processedData = {
          ...mediaData,
          source: "shopee-affiliate-api",
        }

        if (mediaData.error) {
          diagnosticResults.success = false
          diagnosticResults.message = `Erro na API oficial: ${mediaData.error}`
        }
      }
    } catch (apiError) {
      // Erro ao chamar a API
      const errorMessage = apiError instanceof Error ? apiError.message : "Erro desconhecido"
      logger.error(`Erro ao testar API: ${errorMessage}`)

      diagnosticResults.success = false
      diagnosticResults.message = `Erro ao testar API: ${errorMessage}`
      diagnosticResults.apiResponse = {
        success: false,
        statusCode: 500,
        statusText: "Error",
        error: errorMessage,
      }

      // Gerar dados de fallback
      const fallbackData = generateFallbackData(productId)
      diagnosticResults.processedData = {
        ...fallbackData,
        source: "fallback",
      }
      diagnosticResults.fallbackUsed = true
    }

    return NextResponse.json(diagnosticResults)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
    logger.error(`Erro ao processar diagnóstico: ${errorMessage}`)

    return NextResponse.json(
      {
        success: false,
        message: `Erro ao processar diagnóstico: ${errorMessage}`,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

/**
 * Gera dados de fallback para quando a API falha
 */
function generateFallbackData(productId: string) {
  // Dados de fallback para demonstração
  return {
    id: `fallback-${productId}`,
    productId: productId,
    name: `Produto ${productId} (Dados de Demonstração)`,
    images: [
      `/placeholder.svg?height=800&width=800&query=Produto+${productId}+Imagem+1`,
      `/placeholder.svg?height=800&width=800&query=Produto+${productId}+Imagem+2`,
      `/placeholder.svg?height=800&width=800&query=Produto+${productId}+Imagem+3`,
    ],
    videos: ["https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4"],
  }
}
