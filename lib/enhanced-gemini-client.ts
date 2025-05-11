import { createLogger } from "@/lib/logger"

const logger = createLogger("enhanced-gemini-client")

// Configurações da API Gemini
const API_CONFIGS = [
  // Modelo principal - gemini-2.0-flash (gratuito)
  {
    version: "v1beta",
    model: "gemini-2.0-flash",
    endpoint: "generateContent",
  },
  // Fallbacks para compatibilidade
  {
    version: "v1beta",
    model: "gemini-1.5-flash",
    endpoint: "generateContent",
  },
  {
    version: "v1beta",
    model: "gemini-1.0-flash",
    endpoint: "generateContent",
  },
]

interface GeminiOptions {
  temperature?: number
  maxOutputTokens?: number
  topK?: number
  topP?: number
}

/**
 * Cliente aprimorado para a API Gemini com suporte a operações automatizadas
 */
export class EnhancedGeminiClient {
  private apiKey: string
  private defaultOptions: GeminiOptions
  private lastCallTimestamp = 0
  private callCount = 0
  private MAX_CALLS_PER_MINUTE = 60 // Limite de chamadas por minuto

  constructor(apiKey: string, defaultOptions: GeminiOptions = {}) {
    if (!apiKey) {
      throw new Error("API key não fornecida para o EnhancedGeminiClient")
    }

    this.apiKey = apiKey
    this.defaultOptions = {
      temperature: 0.8, // Aumentado para mais criatividade
      maxOutputTokens: 300, // Aumentado para respostas mais detalhadas
      topK: 40,
      topP: 0.95,
      ...defaultOptions,
    }
  }

  /**
   * Gera conteúdo usando a API Gemini com rate limiting automático
   */
  async generateContent(prompt: string, options: GeminiOptions = {}): Promise<string> {
    await this.enforceRateLimit()
    const mergedOptions = { ...this.defaultOptions, ...options }

    // Armazenar erros para diagnóstico
    const errors: Record<string, any> = {}

    // Tentar cada configuração da API em sequência
    for (const config of API_CONFIGS) {
      try {
        logger.info(`Tentando gerar conteúdo com a API Gemini: ${config.version}/${config.model}`)
        const result = await this.callApi(config, prompt, mergedOptions)
        logger.info(`Geração bem-sucedida com a API Gemini: ${config.version}/${config.model}`)
        return result
      } catch (error: any) {
        const configKey = `${config.version}/${config.model}`
        logger.warn(`Falha ao gerar conteúdo com a API Gemini ${configKey}: ${error.message}`)
        errors[configKey] = error.message
        // Continuar para a próxima configuração
      }
    }

    // Se chegamos aqui, todas as configurações falharam
    const errorDetails = Object.entries(errors)
      .map(([config, error]) => `${config}: ${error}`)
      .join("; ")

    throw new Error(`Falha em todas as configurações da API Gemini: ${errorDetails}`)
  }

  /**
   * Implementa rate limiting para evitar exceder limites da API
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now()
    const elapsedSinceLastCall = now - this.lastCallTimestamp

    // Resetar contador se passou mais de um minuto
    if (elapsedSinceLastCall > 60000) {
      this.callCount = 0
      this.lastCallTimestamp = now
      return
    }

    // Verificar se excedemos o limite
    if (this.callCount >= this.MAX_CALLS_PER_MINUTE) {
      const timeToWait = 60000 - elapsedSinceLastCall
      logger.warn(`Rate limit atingido. Aguardando ${timeToWait}ms antes da próxima chamada.`)
      await new Promise((resolve) => setTimeout(resolve, timeToWait))
      this.callCount = 0
      this.lastCallTimestamp = Date.now()
    } else {
      this.callCount++
      this.lastCallTimestamp = now
    }
  }

  /**
   * Chama a API Gemini com uma configuração específica
   */
  private async callApi(
    config: { version: string; model: string; endpoint: string },
    prompt: string,
    options: GeminiOptions,
  ): Promise<string> {
    const { version, model, endpoint } = config
    const apiUrl = `https://generativelanguage.googleapis.com/${version}/models/${model}:${endpoint}?key=${this.apiKey}`

    logger.info(`Chamando API Gemini: ${version}/${model}`)

    try {
      const response = await fetch(apiUrl, {
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
            temperature: options.temperature,
            maxOutputTokens: options.maxOutputTokens,
            topK: options.topK,
            topP: options.topP,
          },
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        logger.error(`Erro na API Gemini (${version}/${model}): ${errorText}`)
        throw new Error(`Erro na API Gemini (${version}/${model}): ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      // Extrair o texto gerado com validação robusta
      if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text.trim()
      }

      logger.error(`Formato de resposta inválido da API Gemini (${version}/${model}): ${JSON.stringify(data)}`)
      throw new Error(`Formato de resposta inválido da API Gemini (${version}/${model})`)
    } catch (error: any) {
      logger.error(`Erro ao chamar API Gemini (${version}/${model}): ${error.message}`)
      throw error
    }
  }

  /**
   * Verifica se a API Gemini está funcionando
   */
  async checkStatus(): Promise<{
    working: boolean
    workingConfig?: { version: string; model: string }
    error?: string
  }> {
    const testPrompt = "Hello, write a short greeting in 5 words or less."

    for (const config of API_CONFIGS) {
      try {
        await this.callApi(config, testPrompt, { maxOutputTokens: 20 })
        return {
          working: true,
          workingConfig: {
            version: config.version,
            model: config.model,
          },
        }
      } catch (error) {
        // Continuar para a próxima configuração
      }
    }

    return {
      working: false,
      error: "Nenhuma configuração da API Gemini está funcionando",
    }
  }
}

/**
 * Cria uma instância do cliente Gemini aprimorado com a API key do ambiente
 */
export function createEnhancedGeminiClient(): EnhancedGeminiClient | null {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    logger.warn("GEMINI_API_KEY não configurada, não foi possível criar o cliente Gemini")
    return null
  }

  return new EnhancedGeminiClient(apiKey)
}

// Instância singleton para uso em toda a aplicação
let geminiClientInstance: EnhancedGeminiClient | null = null

/**
 * Obtém a instância singleton do cliente Gemini
 */
export function getGeminiClient(): EnhancedGeminiClient | null {
  if (!geminiClientInstance) {
    geminiClientInstance = createEnhancedGeminiClient()
  }
  return geminiClientInstance
}
