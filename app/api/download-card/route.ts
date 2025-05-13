import { type NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { createLogger } from "@/lib/logger"

const logger = createLogger("API:DownloadCard")

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const cardPath = searchParams.get("path")

    if (!cardPath) {
      logger.warn("Missing card path")
      return NextResponse.json({ success: false, message: "Card path is required" }, { status: 400 })
    }

    logger.info("Download card request", { cardPath })

    // Verificar se é uma URL do Blob Storage
    if (cardPath.startsWith("http")) {
      logger.info("Redirecting to Blob Storage URL", { url: cardPath })
      return NextResponse.redirect(cardPath)
    }

    // Caso contrário, tentar ler do sistema de arquivos local
    try {
      // Verificar se o arquivo existe
      if (!fs.existsSync(cardPath)) {
        logger.warn("Card file not found", { cardPath })
        return NextResponse.json({ success: false, message: "Card file not found" }, { status: 404 })
      }

      // Ler o arquivo
      const fileBuffer = fs.readFileSync(cardPath)
      const fileName = path.basename(cardPath)

      // Retornar o arquivo como resposta
      const response = new NextResponse(fileBuffer)
      response.headers.set("Content-Type", "image/png")
      response.headers.set("Content-Disposition", `attachment; filename="${fileName}"`)

      logger.info("Card download successful", { fileName })
      return response
    } catch (fsError) {
      logger.error("Error reading card file:", fsError)
      return NextResponse.json(
        {
          success: false,
          message: "Erro ao ler arquivo do card",
          error: fsError.message,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    logger.error("Error processing download request:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Falha ao processar solicitação de download",
        error: error.message || "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
