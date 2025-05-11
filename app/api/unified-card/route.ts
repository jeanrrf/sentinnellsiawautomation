import { type NextRequest, NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"
import { getUnifiedCardService, GenerationMode } from "@/lib/unified-card-service"

const logger = createLogger("unified-card-api")

export async function POST(request: NextRequest) {
  try {
    // Obter dados do corpo da requisição
    const body = await request.json()

    // Extrair dados com validação adequada
    const { product, config = {} } = body

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: "Produto não fornecido",
          message: "AVISO: É necessário fornecer um produto para gerar o card.",
        },
        { status: 400 },
      )
    }

    logger.info("Solicitação de geração de card recebida", {
      productId: product.itemId,
      mode: config.mode || GenerationMode.MANUAL,
    })

    // Obter serviço unificado
    const cardService = getUnifiedCardService()

    // Gerar cards
    const result = await cardService.generateCards(product, config)

    if (!result.success) {
      throw new Error(result.error || "Erro desconhecido na geração de cards")
    }

    // Retornar resultado
    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error: any) {
    logger.error("Erro na geração de card", { error: error.message, stack: error.stack })

    return NextResponse.json(
      {
        success: false,
        error: "Erro ao gerar card",
        details: error.message,
        message: "AVISO: Ocorreu um erro ao gerar o card. Por favor, tente novamente.",
      },
      { status: 500 },
    )
  }
}
