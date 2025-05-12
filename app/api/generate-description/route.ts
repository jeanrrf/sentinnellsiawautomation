import { NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"
import storageService from "@/lib/storage-service"

const logger = createLogger("API:GenerateDescription")

export async function POST(request: Request) {
  try {
    const { productId, productName, productDescription } = await request.json()

    if (!productId || !productName) {
      return NextResponse.json(
        {
          success: false,
          message: "ID do produto e nome são obrigatórios",
        },
        { status: 400 },
      )
    }

    // Verificar se já temos uma descrição para este produto
    const existingDescription = await storageService.getDescription(productId)
    if (existingDescription) {
      return NextResponse.json({
        success: true,
        description: existingDescription,
        source: "storage",
      })
    }

    // Se não temos uma descrição, gerar uma nova
    let description = ""

    if (productDescription) {
      // Usar a descrição fornecida
      description = productDescription
    } else {
      // Gerar uma descrição genérica
      description = `${productName} - Um produto de alta qualidade com excelente custo-benefício. Ideal para quem busca qualidade e durabilidade.`
    }

    // Salvar a descrição no armazenamento temporário
    await storageService.saveDescription(productId, description)

    return NextResponse.json({
      success: true,
      description,
      source: "generated",
    })
  } catch (error: any) {
    logger.error("Erro ao gerar descrição:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Falha ao gerar descrição: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
