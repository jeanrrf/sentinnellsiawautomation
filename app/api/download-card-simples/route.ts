import { createLogger } from "@/lib/logger"
import { getRedisClient } from "@/lib/redis"

const logger = createLogger("API:DownloadCardSimples")

export async function GET(request: Request) {
  try {
    logger.info("Download de card simples iniciado")

    // Obter parâmetros da URL
    const { searchParams } = new URL(request.url)
    const cardId = searchParams.get("id")

    if (!cardId) {
      return new Response("ID do card não fornecido. Use ?id=CARD_ID", {
        status: 400,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      })
    }

    // Verificar se estamos no Vercel
    const isVercel = process.env.VERCEL === "1"
    let cardPath = null

    if (isVercel) {
      try {
        // Em produção, usar Redis
        const redis = getRedisClient()
        if (!redis) {
          throw new Error("Cliente Redis não disponível")
        }

        // Tentar obter o card do Redis
        const cardKey = `shopee:card:${cardId}`
        const cardData = await redis.get(cardKey)

        if (!cardData) {
          return new Response(`Card com ID ${cardId} não encontrado no Redis`, {
            status: 404,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          })
        }

        // Extrair o caminho do card
        let cardObj
        if (typeof cardData === "string") {
          try {
            cardObj = JSON.parse(cardData)
          } catch (parseError) {
            throw new Error(`Erro ao analisar dados do card: ${parseError.message}`)
          }
        } else {
          cardObj = cardData
        }

        cardPath = cardObj.cardPath || cardObj.imagePath || cardObj.path

        if (!cardPath) {
          // Se não encontrar o caminho, gerar um arquivo de texto com os dados do card
          const cardInfo = JSON.stringify(cardObj, null, 2)
          return new Response(`Dados do card ${cardId}:\n\n${cardInfo}`, {
            status: 200,
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
              "Content-Disposition": `attachment; filename="card-info-${cardId}.txt"`,
            },
          })
        }
      } catch (redisError) {
        logger.error("Erro ao acessar Redis:", redisError)
        return new Response(`Erro ao acessar Redis: ${redisError.message}`, {
          status: 500,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        })
      }
    } else {
      // Em desenvolvimento, gerar um arquivo de exemplo
      return new Response(`Arquivo de exemplo para o card ${cardId} gerado em ${new Date().toLocaleString("pt-BR")}`, {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition": `attachment; filename="card-exemplo-${cardId}.txt"`,
        },
      })
    }

    // Se temos um caminho para o card, verificar se é uma URL ou caminho local
    if (cardPath) {
      if (cardPath.startsWith("http")) {
        // Redirecionar para a URL
        return Response.redirect(cardPath)
      } else {
        try {
          // Tentar ler o arquivo local
          const fs = await import("fs")
          const path = await import("path")

          const fullPath = cardPath.startsWith("/") ? cardPath : path.default.join(process.cwd(), cardPath)

          if (!fs.default.existsSync(fullPath)) {
            return new Response(`Arquivo não encontrado: ${fullPath}`, {
              status: 404,
              headers: { "Content-Type": "text/plain; charset=utf-8" },
            })
          }

          const fileData = fs.default.readFileSync(fullPath)
          const fileName = path.default.basename(fullPath)

          return new Response(fileData, {
            status: 200,
            headers: {
              "Content-Type": "application/octet-stream",
              "Content-Disposition": `attachment; filename="${fileName}"`,
            },
          })
        } catch (fsError) {
          logger.error("Erro ao ler arquivo:", fsError)
          return new Response(`Erro ao ler arquivo: ${fsError.message}`, {
            status: 500,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          })
        }
      }
    }

    // Fallback se algo der errado
    return new Response("Não foi possível encontrar ou processar o card solicitado", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  } catch (error) {
    logger.error("Erro no download de card simples:", error)
    return new Response(`Erro no download de card: ${error.message || "Erro desconhecido"}`, {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  }
}
