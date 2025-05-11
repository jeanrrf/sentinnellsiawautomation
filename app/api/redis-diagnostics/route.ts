import { NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"
import { getRedisClient, isRedisAvailable } from "@/lib/redis"

const logger = createLogger("API:RedisDiagnostics")

export async function GET() {
  try {
    logger.info("Iniciando diagnóstico do Redis")

    // Verificar se o Redis está configurado
    const redisClient = getRedisClient()
    const isConfigured = !!redisClient

    // Verificar se o Redis está conectado
    let isConnected = false
    if (isConfigured) {
      isConnected = await isRedisAvailable()
    }

    // Informações básicas
    const diagnosticInfo = {
      timestamp: new Date().toISOString(),
      configured: isConfigured,
      connected: isConnected,
      status: isConnected ? "healthy" : isConfigured ? "error" : "not_configured",
      details: {},
      suggestions: [],
    }

    // Adicionar sugestões com base no status
    if (!isConfigured) {
      diagnosticInfo.suggestions.push("Verifique se as variáveis de ambiente do Redis estão configuradas corretamente")
      diagnosticInfo.suggestions.push("Adicione KV_REST_API_URL e KV_REST_API_TOKEN ao seu arquivo .env")
    } else if (!isConnected) {
      diagnosticInfo.suggestions.push("Verifique se o serviço Redis está em execução")
      diagnosticInfo.suggestions.push("Verifique se as credenciais do Redis estão corretas")
      diagnosticInfo.suggestions.push("Verifique se há problemas de rede que possam estar bloqueando a conexão")
    }

    // Realizar testes adicionais com tratamento de erros
    if (isConfigured && isConnected) {
      try {
        // Teste de ping com timeout
        const pingStart = Date.now()
        await Promise.race([
          redisClient.ping(),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2000)),
        ])
        const pingTime = Date.now() - pingStart

        // Adicionar detalhes do ping
        diagnosticInfo.details = {
          ...diagnosticInfo.details,
          pingTime: `${pingTime}ms`,
          performance: pingTime < 100 ? "excellent" : pingTime < 300 ? "good" : "slow",
        }

        // Adicionar sugestões com base no desempenho
        if (pingTime >= 300) {
          diagnosticInfo.suggestions.push(
            "O Redis está respondendo lentamente. Verifique a carga do servidor ou problemas de rede.",
          )
        }
      } catch (error) {
        logger.error("Erro ao realizar testes adicionais", { error })
        diagnosticInfo.details = {
          ...diagnosticInfo.details,
          testError: error instanceof Error ? error.message : "Erro desconhecido",
        }
        diagnosticInfo.suggestions.push(
          "Ocorreu um erro durante os testes adicionais. Verifique os logs para mais detalhes.",
        )
      }
    }

    logger.info("Diagnóstico do Redis concluído", { status: diagnosticInfo.status })
    return NextResponse.json(diagnosticInfo)
  } catch (error) {
    logger.error("Erro ao realizar diagnóstico do Redis", { error })
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        configured: false,
        connected: false,
        status: "error",
        error: error instanceof Error ? error.message : "Erro desconhecido",
        suggestions: ["Ocorreu um erro inesperado. Verifique os logs para mais detalhes."],
      },
      { status: 500 },
    )
  }
}
