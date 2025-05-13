import { type NextRequest, NextResponse } from "next/server"
import { logger } from "@/lib/logger"
import { getShopeeAffiliateAPI } from "@/lib/shopee-affiliate-api"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const productId = searchParams.get("productId")

  if (!productId) {
    return NextResponse.json({ message: "ID do produto é obrigatório" }, { status: 400 })
  }

  try {
    logger.info(`Buscando mídia para o produto: ${productId}`)

    // Obter a API de afiliados da Shopee
    const shopeeAPI = getShopeeAffiliateAPI()

    if (!shopeeAPI) {
      logger.error("API de afiliados da Shopee não disponível - verifique as credenciais")
      throw new Error("API de afiliados da Shopee não disponível - verifique as credenciais")
    }

    // Usar a API oficial para buscar mídia do produto
    const mediaData = await shopeeAPI.getProductMedia(productId)

    // Verificar se houve erro na busca
    if (mediaData.error || mediaData.images.length === 0) {
      logger.warning(`Erro ou nenhuma imagem encontrada via API oficial: ${mediaData.error || "Sem imagens"}`)
      throw new Error(mediaData.error || "Nenhuma imagem encontrada para este produto")
    }

    // Se tudo correr bem, retornar os dados da API
    const response = {
      id: `media-${productId}`,
      productId: productId,
      name: mediaData.name,
      images: mediaData.images,
      videos: mediaData.videos,
      source: "shopee-affiliate-api",
    }

    return NextResponse.json(response)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
    logger.error(`Erro ao processar requisição de mídia: ${errorMessage}`)

    return NextResponse.json(
      {
        success: false,
        message: `Erro ao buscar mídia do produto: ${errorMessage}`,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
