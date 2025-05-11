import { NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"
import { createGeminiClient } from "@/lib/gemini-client"

const logger = createLogger("gemini-status-api")

export async function GET() {
  try {
    const geminiClient = createGeminiClient()

    if (!geminiClient) {
      return NextResponse.json({
        success: false,
        error: "GEMINI_API_KEY não configurada",
      })
    }

    // Verificar status da API
    const status = await geminiClient.checkStatus()

    // Tentar listar modelos disponíveis
    let models = null
    try {
      models = await geminiClient.listModels()
    } catch (error: any) {
      logger.warn(`Não foi possível listar modelos: ${error.message}`)
    }

    // Testar geração de conteúdo se a API estiver funcionando
    let testGeneration = null
    if (status.working) {
      try {
        const testPrompt = "Write a short product description for a smartphone in 20 words or less."
        const generatedText = await geminiClient.generateContent(testPrompt, { maxOutputTokens: 50 })
        testGeneration = {
          success: true,
          text: generatedText,
        }
      } catch (error: any) {
        testGeneration = {
          success: false,
          error: error.message,
        }
      }
    }

    // Mascarar a API key para segurança
    const apiKey = process.env.GEMINI_API_KEY || ""
    const maskedKey =
      apiKey.length > 8 ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : "Invalid key"

    return NextResponse.json({
      success: true,
      apiKeyPrefix: maskedKey,
      status,
      models: models
        ? {
            success: true,
            data: models,
          }
        : {
            success: false,
            error: "Não foi possível listar modelos",
          },
      testGeneration,
    })
  } catch (error: any) {
    logger.error(`Error checking Gemini status: ${error.message}`)

    return NextResponse.json({
      success: false,
      error: error.message,
    })
  }
}
