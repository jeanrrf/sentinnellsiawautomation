import { NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"
import storageService from "@/lib/storage-service"

const logger = createLogger("API:Descriptions")

export async function GET() {
  try {
    // Como não temos mais Redis, retornamos uma mensagem informativa
    return NextResponse.json({
      success: true,
      descriptions: [],
      message: "Funcionalidade de listagem de descrições não está disponível sem armazenamento persistente",
    })
  } catch (error: any) {
    logger.error("Erro ao buscar descrições:", error)

    return NextResponse.json(
      {
        success: false,
        message: `Falha ao buscar descrições: ${error.message}`,
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const { productId, description } = await request.json()

    if (!productId || !description) {
      return NextResponse.json(
        {
          success: false,
          message: "ID do produto e descrição são obrigatórios",
        },
        { status: 400 },
      )
    }

    // Salvar descrição no armazenamento temporário
    await storageService.saveDescription(productId, description)

    return NextResponse.json({
      success: true,
      message: "Descrição salva com sucesso",
    })
  } catch (error: any) {
    logger.error("Erro ao salvar descrição:", error)

    return NextResponse.json(
      {
        success: false,
        message: `Falha ao salvar descrição: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
