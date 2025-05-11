import { type NextRequest, NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"
import { getUnifiedCardService, GenerationMode } from "@/lib/unified-card-service"

const logger = createLogger("unified-card-api")

export async function POST(request: NextRequest) {
  try {
    // Obter dados do corpo da requisição
    const body = await request.json()

    // Extrair dados com validação adequada
    const { product, config = {}, action = "generate" } = body

    // Validar ação
    if (!["generate", "schedule", "execute-schedule", "get-history", "get-schedules"].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          error: "Ação inválida",
          message: "AVISO: A ação especificada não é suportada.",
        },
        { status: 400 },
      )
    }

    // Obter serviço unificado
    const cardService = getUnifiedCardService()

    // Processar com base na ação
    switch (action) {
      case "generate":
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

        // Gerar cards
        const result = await cardService.generateCards(product, config)

        if (!result.success) {
          throw new Error(result.error || "Erro desconhecido na geração de cards")
        }

        return NextResponse.json({
          success: true,
          ...result,
        })

      case "schedule":
        if (!body.schedule) {
          return NextResponse.json(
            {
              success: false,
              error: "Agendamento não fornecido",
              message: "AVISO: É necessário fornecer um agendamento.",
            },
            { status: 400 },
          )
        }

        logger.info("Solicitação de criação/atualização de agendamento recebida", {
          scheduleId: body.schedule.id,
        })

        // Salvar agendamento
        const saveResult = await cardService.saveSchedule(body.schedule)

        return NextResponse.json({
          success: saveResult,
          message: saveResult ? "Agendamento salvo com sucesso" : "AVISO: Não foi possível salvar o agendamento.",
        })

      case "execute-schedule":
        if (!body.scheduleId) {
          return NextResponse.json(
            {
              success: false,
              error: "ID do agendamento não fornecido",
              message: "AVISO: É necessário fornecer o ID do agendamento a ser executado.",
            },
            { status: 400 },
          )
        }

        logger.info("Solicitação de execução de agendamento recebida", {
          scheduleId: body.scheduleId,
        })

        // Executar agendamento
        const executeResult = await cardService.executeScheduledGeneration(body.scheduleId)

        return NextResponse.json({
          success: executeResult.success,
          results: executeResult.results,
        })

      case "get-history":
        logger.info("Solicitação de histórico de geração recebida")

        // Obter histórico
        const history = await cardService.getGenerationHistory(body.limit || 20)

        return NextResponse.json({
          success: true,
          history,
        })

      case "get-schedules":
        logger.info("Solicitação de lista de agendamentos recebida")

        // Obter agendamentos
        const schedules = await cardService.getSchedules()

        return NextResponse.json({
          success: true,
          schedules,
        })

      default:
        return NextResponse.json(
          {
            success: false,
            error: "Ação não implementada",
            message: "AVISO: A ação especificada não está implementada.",
          },
          { status: 501 },
        )
    }
  } catch (error: any) {
    logger.error("Erro na API unificada", { error: error.message, stack: error.stack })

    return NextResponse.json(
      {
        success: false,
        error: "Erro ao processar solicitação",
        details: error.message,
        message: "AVISO: Ocorreu um erro ao processar a solicitação. Por favor, tente novamente.",
      },
      { status: 500 },
    )
  }
}
