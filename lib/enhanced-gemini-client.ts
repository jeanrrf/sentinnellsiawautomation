import { createLogger } from "@/lib/logger"

const logger = createLogger("enhanced-gemini-client")

/**
 * Interface para o cliente Gemini
 */
export interface GeminiClient {
  generateContent: (prompt: string, options?: any) => Promise<string>
}

/**
 * Cliente aprimorado para a API Gemini
 */
class EnhancedGeminiClient implements GeminiClient {
  private apiKey: string
  private baseUrl: string
  private model: string

  constructor(apiKey: string, model = "gemini-pro") {
    this.apiKey = apiKey
    this.baseUrl = "https://generativelanguage.googleapis.com/v1beta"
    this.model = model
  }

  /**
   * Gera conteúdo usando a API Gemini
   */
  async generateContent(prompt: string, options: any = {}): Promise<string> {
    try {
      const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`

      const defaultOptions = {
        temperature: 0.7,
        maxOutputTokens: 300,
        topK: 40,
        topP: 0.95,
      }

      const mergedOptions = { ...defaultOptions, ...options }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: mergedOptions.temperature,
            maxOutputTokens: mergedOptions.maxOutputTokens,
            topK: mergedOptions.topK,
            topP: mergedOptions.topP,
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Erro na API Gemini: ${errorData.error?.message || response.statusText}`)
      }

      const data = await response.json()

      // Extrair o texto gerado
      if (
        data.candidates &&
        data.candidates.length > 0 &&
        data.candidates[0].content &&
        data.candidates[0].content.parts &&
        data.candidates[0].content.parts.length > 0
      ) {
        return data.candidates[0].content.parts[0].text || ""
      }

      throw new Error("Formato de resposta inesperado da API Gemini")
    } catch (error: any) {
      logger.error(`Erro ao gerar conteúdo: ${error.message}`)
      throw error
    }
  }
}

// Instância singleton
let geminiClientInstance: GeminiClient | null = null

/**
 * Obtém a instância do cliente Gemini
 */
export function getGeminiClient(): GeminiClient | null {
  if (!geminiClientInstance) {
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      logger.warn("Chave de API Gemini não encontrada")
      return null
    }

    geminiClientInstance = new EnhancedGeminiClient(apiKey)
  }

  return geminiClientInstance
}
