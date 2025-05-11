import { type NextRequest, NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"
import { getTextGenerationService, TextTone } from "@/lib/text-generation-service"

const logger = createLogger("generate-description-api")

export async function POST(request: NextRequest) {
  try {
    const { product, options = {} } = await request.json()

    if (!product) {
      logger.warn("Missing product in request")
      return NextResponse.json(
        {
          success: false,
          error: "Produto não fornecido",
          message: "AVISO: Nenhum produto foi fornecido para gerar a descrição.",
        },
        { status: 400 },
      )
    }

    logger.info(`Generating description for product: ${product.itemId || "unknown"}`)

    // Obter o serviço de geração de texto
    const textGenerationService = getTextGenerationService()

    // Configurar opções com base nos parâmetros recebidos
    const generationOptions = {
      tone: options.tone || [TextTone.YOUTHFUL, TextTone.HUMOROUS, TextTone.PERSUASIVE],
      maxLength: options.maxLength || 300,
      includeEmojis: options.includeEmojis !== false,
      includeHashtags: options.includeHashtags !== false,
      highlightDiscount: options.highlightDiscount !== false,
      highlightFeatures: options.highlightFeatures !== false,
      highlightUrgency: options.highlightUrgency !== false,
    }

    // Gerar descrição
    const description = await textGenerationService.generateProductDescription(product, generationOptions)

    return NextResponse.json({
      success: true,
      description,
      source: "gemini",
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    logger.error("Error generating description", {
      details: error,
    })

    return NextResponse.json(
      {
        success: false,
        error: "Erro ao gerar descrição",
        details: error.message,
        message: "AVISO: Ocorreu um erro ao gerar a descrição do produto.",
      },
      { status: 500 },
    )
  }
}
