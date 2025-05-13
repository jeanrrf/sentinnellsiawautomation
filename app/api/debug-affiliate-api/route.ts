import { type NextRequest, NextResponse } from "next/server"
import { logger } from "@/lib/logger"
import { getShopeeAffiliateAPI } from "@/lib/shopee-affiliate-api"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const action = searchParams.get("action") || "test"
  const productId = searchParams.get("productId")
  const keyword = searchParams.get("keyword")
  const limit = Number.parseInt(searchParams.get("limit") || "10", 10)

  try {
    logger.info(`Iniciando diagnóstico da API de afiliados da Shopee: ação=${action}`)

    // Verificar variáveis de ambiente
    const envCheck = {
      SHOPEE_APP_ID: process.env.SHOPEE_APP_ID ? "✅ Configurado" : "❌ Não configurado",
      SHOPEE_APP_SECRET: process.env.SHOPEE_APP_SECRET ? "✅ Configurado" : "❌ Não configurado",
      SHOPEE_AFFILIATE_API_URL: process.env.SHOPEE_AFFILIATE_API_URL ? "✅ Configurado" : "❌ Não configurado",
      SHOPEE_AFFILIATE_ID: process.env.SHOPEE_AFFILIATE_ID ? "✅ Configurado" : "❌ Não configurado",
    }

    // Obter a API de afiliados da Shopee
    const shopeeAPI = getShopeeAffiliateAPI()

    if (!shopeeAPI) {
      return NextResponse.json({
        success: false,
        message: "API de afiliados da Shopee não disponível - verifique as credenciais",
        envCheck,
        timestamp: new Date().toISOString(),
      })
    }

    // Executar a ação solicitada
    let result
    let success = true
    let message = "Operação concluída com sucesso"

    switch (action) {
      case "test":
        // Teste básico de conectividade
        result = {
          status: "API de afiliados da Shopee disponível",
          timestamp: new Date().toISOString(),
        }
        break

      case "product":
        // Buscar detalhes de um produto
        if (!productId) {
          return NextResponse.json(
            {
              success: false,
              message: "ID do produto é obrigatório para a ação 'product'",
              envCheck,
            },
            { status: 400 },
          )
        }

        try {
          result = await shopeeAPI.getProductDetail(productId)
          if (result.error) {
            success = false
            message = `Erro ao buscar detalhes do produto: ${result.error}`
          }
        } catch (error) {
          success = false
          message = `Erro ao buscar detalhes do produto: ${error instanceof Error ? error.message : "Erro desconhecido"}`
          result = { error: message }
        }
        break

      case "media":
        // Buscar mídia de um produto
        if (!productId) {
          return NextResponse.json(
            {
              success: false,
              message: "ID do produto é obrigatório para a ação 'media'",
              envCheck,
            },
            { status: 400 },
          )
        }

        try {
          result = await shopeeAPI.getProductMedia(productId)
          if (result.error) {
            success = false
            message = `Erro ao buscar mídia do produto: ${result.error}`
          }
        } catch (error) {
          success = false
          message = `Erro ao buscar mídia do produto: ${error instanceof Error ? error.message : "Erro desconhecido"}`
          result = { error: message }
        }
        break

      case "search":
        // Buscar produtos por palavra-chave
        try {
          const searchParams: any = { limit }
          if (keyword) {
            searchParams.keyword = keyword
          }

          result = await shopeeAPI.searchProducts(searchParams)
          if (!result || result.length === 0) {
            message = "Nenhum produto encontrado"
          }
        } catch (error) {
          success = false
          message = `Erro ao buscar produtos: ${error instanceof Error ? error.message : "Erro desconhecido"}`
          result = { error: message }
        }
        break

      case "bestsellers":
        // Buscar produtos mais vendidos
        try {
          result = await shopeeAPI.getBestSellers(limit)
          if (!result || result.length === 0) {
            message = "Nenhum produto encontrado"
          }
        } catch (error) {
          success = false
          message = `Erro ao buscar produtos mais vendidos: ${error instanceof Error ? error.message : "Erro desconhecido"}`
          result = { error: message }
        }
        break

      default:
        return NextResponse.json(
          {
            success: false,
            message: `Ação desconhecida: ${action}`,
            envCheck,
          },
          { status: 400 },
        )
    }

    return NextResponse.json({
      success,
      message,
      action,
      envCheck,
      result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
    logger.error(`Erro ao processar diagnóstico da API de afiliados: ${errorMessage}`)

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
