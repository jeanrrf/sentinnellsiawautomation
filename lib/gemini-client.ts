import { createLogger } from "@/lib/logger"

const logger = createLogger("gemini-client")

// Configurações da API Gemini
// Usando o modelo correto conforme documentação oficial
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
 * Cliente para a API Gemini que usa o modelo Flash gratuito
 * Implementação baseada na documentação oficial:
 * https://ai.google.dev/gemini-api/docs/text-generation
 */
export class GeminiClient {
  private apiKey: string
  private defaultOptions: GeminiOptions

  constructor(apiKey: string, defaultOptions: GeminiOptions = {}) {
    if (!apiKey) {
      throw new Error("API key não fornecida para o GeminiClient")
    }

    this.apiKey = apiKey
    this.defaultOptions = {
      temperature: 0.7,
      maxOutputTokens: 200,
      topK: 40,
      topP: 0.95,
      ...defaultOptions,
    }
  }

  /**
   * Gera conteúdo usando a API Gemini Flash (gratuita)
   * @param prompt O prompt para gerar conteúdo
   * @param options Opções para a geração de conteúdo
   * @returns O texto gerado
   */
  async generateContent(prompt: string, options: GeminiOptions = {}): Promise<string> {
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
   * Chama a API Gemini com uma configuração específica
   * Implementação baseada na documentação oficial
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
   * @returns Informações sobre o status da API
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

  /**
   * Lista os modelos disponíveis na API Gemini
   * @returns Lista de modelos disponíveis
   */
  async listModels(): Promise<any> {
    try {
      // Tentar listar modelos na v1beta primeiro
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`

      const response = await fetch(apiUrl)

      if (!response.ok) {
        throw new Error(`Erro ao listar modelos: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error: any) {
      logger.error(`Erro ao listar modelos: ${error.message}`)
      throw error
    }
  }
}

/**
 * Cria uma instância do cliente Gemini com a API key do ambiente
 * @returns Uma instância do GeminiClient ou null se a API key não estiver configurada
 */
export function createGeminiClient(): GeminiClient | null {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    logger.warn("GEMINI_API_KEY não configurada, não foi possível criar o cliente Gemini")
    return null
  }

  return new GeminiClient(apiKey)
}
