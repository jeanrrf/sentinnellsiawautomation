import { createLogger } from "@/lib/logger"
import { getTextGenerationService } from "./text-generation-service"
import { getRedisClient } from "./redis"
import { REDIS_KEYS } from "./redis-constants"

const logger = createLogger("unified-card-service")

// Tipos de geração
export enum GenerationMode {
  MANUAL = "manual", // Designer - controle total
  QUICK = "quick", // Geração rápida - mínimas configurações
  AUTOMATED = "automated", // Automação - execução agendada
}

// Configurações unificadas para geração de cards
export interface CardGenerationConfig {
  // Configurações visuais
  template: string
  darkMode: boolean
  accentColor?: string
  showBadges?: boolean
  roundedCorners?: boolean

  // Configurações de conteúdo
  useAI: boolean
  customDescription?: string
  includeEmojis?: boolean
  includeHashtags?: boolean
  highlightDiscount?: boolean
  highlightUrgency?: boolean

  // Configurações de saída
  includeSecondVariation?: boolean
  outputFormats: string[] // "png", "jpeg", etc.

  // Metadados
  mode: GenerationMode
  scheduleId?: string
  userId?: string
  createdAt?: string
}

// Resultado da geração
export interface CardGenerationResult {
  success: boolean
  error?: string
  cardUrls: {
    [format: string]: string
  }
  secondaryCardUrls?: {
    [format: string]: string
  }
  description?: string
  product?: any
  metadata?: {
    generationTime: number
    mode: GenerationMode
    template: string
  }
}

// Configurações padrão
const defaultConfig: Partial<CardGenerationConfig> = {
  template: "modern",
  darkMode: true,
  showBadges: true,
  roundedCorners: true,
  useAI: true,
  includeEmojis: true,
  includeHashtags: true,
  highlightDiscount: true,
  highlightUrgency: true,
  includeSecondVariation: true,
  outputFormats: ["png", "jpeg"],
  mode: GenerationMode.MANUAL,
}

/**
 * Serviço unificado para geração de cards de produtos
 */
export class UnifiedCardService {
  /**
   * Gera cards para um produto com base nas configurações fornecidas
   */
  async generateCards(product: any, config: Partial<CardGenerationConfig> = {}): Promise<CardGenerationResult> {
    const startTime = Date.now()

    try {
      // Mesclar configurações padrão com as fornecidas
      const fullConfig: CardGenerationConfig = { ...defaultConfig, ...config } as CardGenerationConfig

      logger.info(`Iniciando geração de cards no modo ${fullConfig.mode}`, {
        productId: product.itemId,
        template: fullConfig.template,
        mode: fullConfig.mode,
      })

      // Gerar descrição se necessário
      let description = fullConfig.customDescription || ""

      if (fullConfig.useAI && !description) {
        try {
          const textService = getTextGenerationService()
          description = await textService.generateProductDescription(product, {
            includeEmojis: fullConfig.includeEmojis,
            includeHashtags: fullConfig.includeHashtags,
            highlightDiscount: fullConfig.highlightDiscount,
            highlightUrgency: fullConfig.highlightUrgency,
          })
        } catch (error) {
          logger.warn("Falha ao gerar descrição com IA, usando fallback", { error })
          description = this.createFallbackDescription(product)
        }
      }

      // Gerar cards usando o template principal
      const cardUrls: { [format: string]: string } = {}
      const secondaryCardUrls: { [format: string]: string } = {}

      // Simulação de geração de cards (em produção, usaria o canvas-card-generator)
      for (const format of fullConfig.outputFormats) {
        // Gerar card principal
        cardUrls[format] = await this.renderCard(product, description, {
          template: fullConfig.template,
          format,
          darkMode: fullConfig.darkMode,
          accentColor: fullConfig.accentColor,
          showBadges: fullConfig.showBadges,
          roundedCorners: fullConfig.roundedCorners,
        })

        // Gerar variação secundária se solicitado
        if (fullConfig.includeSecondVariation) {
          const secondaryTemplate = this.getAlternativeTemplate(fullConfig.template)
          secondaryCardUrls[format] = await this.renderCard(product, description, {
            template: secondaryTemplate,
            format,
            darkMode: fullConfig.darkMode,
            accentColor: fullConfig.accentColor,
            showBadges: fullConfig.showBadges,
            roundedCorners: fullConfig.roundedCorners,
          })
        }
      }

      // Salvar histórico de geração se não for modo manual
      if (fullConfig.mode !== GenerationMode.MANUAL) {
        await this.saveGenerationHistory(product, fullConfig, cardUrls)
      }

      const generationTime = Date.now() - startTime

      logger.info(`Geração de cards concluída em ${generationTime}ms`, {
        productId: product.itemId,
        mode: fullConfig.mode,
        formats: Object.keys(cardUrls),
      })

      return {
        success: true,
        cardUrls,
        secondaryCardUrls: fullConfig.includeSecondVariation ? secondaryCardUrls : undefined,
        description,
        product,
        metadata: {
          generationTime,
          mode: fullConfig.mode,
          template: fullConfig.template,
        },
      }
    } catch (error: any) {
      logger.error("Erro na geração de cards", { error: error.message, stack: error.stack })

      return {
        success: false,
        error: error.message || "Erro desconhecido na geração de cards",
        cardUrls: {},
        metadata: {
          generationTime: Date.now() - startTime,
          mode: config.mode || GenerationMode.MANUAL,
          template: config.template || "modern",
        },
      }
    }
  }

  /**
   * Renderiza um card de produto (simulação)
   * Em produção, usaria o canvas-card-generator
   */
  private async renderCard(product: any, description: string, options: any): Promise<string> {
    // Simulação - em produção, usaria o canvas-card-generator
    return `/api/render-card/${options.format}/${product.itemId}?template=${options.template}&darkMode=${options.darkMode}`
  }

  /**
   * Obtém um template alternativo com base no template principal
   */
  private getAlternativeTemplate(template: string): string {
    const templates = {
      modern: "elegant",
      elegant: "bold",
      bold: "minimal",
      minimal: "vibrant",
      vibrant: "modern",
    }

    return templates[template as keyof typeof templates] || "elegant"
  }

  /**
   * Cria uma descrição de fallback quando a IA falha
   */
  private createFallbackDescription(product: any): string {
    // Implementação simplificada - em produção, usaria a lógica completa
    return `🔥 SUPER OFERTA! 🔥\n\n${product.productName}\n\n💰 Apenas R$ ${product.price}\n\n#oferta #shopee #desconto`
  }

  /**
   * Salva o histórico de geração no Redis
   */
  private async saveGenerationHistory(
    product: any,
    config: CardGenerationConfig,
    cardUrls: { [format: string]: string },
  ): Promise<void> {
    try {
      const redis = await getRedisClient()

      if (!redis) {
        logger.warn("Redis não disponível, histórico de geração não será salvo")
        return
      }

      const historyEntry = {
        id: `gen_${Date.now()}`,
        productId: product.itemId,
        productName: product.productName,
        timestamp: new Date().toISOString(),
        mode: config.mode,
        template: config.template,
        cardUrls,
        scheduleId: config.scheduleId,
      }

      // Obter histórico existente
      const historyJson = await redis.get(REDIS_KEYS.generationHistory)
      const history = historyJson ? JSON.parse(historyJson) : []

      // Adicionar nova entrada
      history.unshift(historyEntry)

      // Limitar tamanho do histórico
      const limitedHistory = history.slice(0, 100)

      // Salvar histórico atualizado
      await redis.set(REDIS_KEYS.generationHistory, JSON.stringify(limitedHistory))

      logger.info("Histórico de geração salvo com sucesso", { id: historyEntry.id })
    } catch (error) {
      logger.error("Erro ao salvar histórico de geração", { error })
    }
  }

  /**
   * Obtém o histórico de geração
   */
  async getGenerationHistory(limit = 20): Promise<any[]> {
    try {
      const redis = await getRedisClient()

      if (!redis) {
        logger.warn("Redis não disponível, retornando histórico vazio")
        return []
      }

      const historyJson = await redis.get(REDIS_KEYS.generationHistory)
      const history = historyJson ? JSON.parse(historyJson) : []

      return history.slice(0, limit)
    } catch (error) {
      logger.error("Erro ao obter histórico de geração", { error })
      return []
    }
  }

  /**
   * Obtém todos os agendamentos
   */
  async getSchedules(): Promise<any[]> {
    try {
      const redis = await getRedisClient()

      if (!redis) {
        logger.warn("Redis não disponível, retornando lista vazia de agendamentos")
        return []
      }

      const schedulesJson = await redis.get(REDIS_KEYS.schedules)
      const schedules = schedulesJson ? JSON.parse(schedulesJson) : []

      return schedules
    } catch (error) {
      logger.error("Erro ao obter agendamentos", { error })
      return []
    }
  }

  /**
   * Cria ou atualiza um agendamento
   */
  async saveSchedule(schedule: any): Promise<boolean> {
    try {
      const redis = await getRedisClient()

      if (!redis) {
        logger.warn("Redis não disponível, agendamento não será salvo")
        return false
      }

      // Garantir que o agendamento tenha um ID
      if (!schedule.id) {
        schedule.id = `schedule_${Date.now()}`
      }

      // Obter agendamentos existentes
      const schedulesJson = await redis.get(REDIS_KEYS.schedules)
      const schedules = schedulesJson ? JSON.parse(schedulesJson) : []

      // Verificar se é uma atualização ou novo agendamento
      const existingIndex = schedules.findIndex((s: any) => s.id === schedule.id)

      if (existingIndex >= 0) {
        // Atualizar agendamento existente
        schedules[existingIndex] = { ...schedules[existingIndex], ...schedule }
      } else {
        // Adicionar novo agendamento
        schedules.push(schedule)
      }

      // Salvar agendamentos atualizados
      await redis.set(REDIS_KEYS.schedules, JSON.stringify(schedules))

      logger.info(`Agendamento ${schedule.id} salvo com sucesso`)
      return true
    } catch (error) {
      logger.error("Erro ao salvar agendamento", { error })
      return false
    }
  }

  /**
   * Executa geração agendada
   */
  async executeScheduledGeneration(scheduleId: string): Promise<{ success: boolean; results: CardGenerationResult[] }> {
    try {
      const redis = await getRedisClient()

      if (!redis) {
        throw new Error("Redis não disponível")
      }

      // Obter agendamento
      const schedulesJson = await redis.get(REDIS_KEYS.schedules)
      const schedules = schedulesJson ? JSON.parse(schedulesJson) : []
      const schedule = schedules.find((s: any) => s.id === scheduleId)

      if (!schedule) {
        throw new Error(`Agendamento ${scheduleId} não encontrado`)
      }

      // Obter produtos para processamento
      const products = await this.getProductsForSchedule(schedule)

      if (products.length === 0) {
        throw new Error("Nenhum produto disponível para processamento")
      }

      // Configuração base para todos os produtos
      const baseConfig: Partial<CardGenerationConfig> = {
        mode: GenerationMode.AUTOMATED,
        scheduleId,
        darkMode: schedule.darkMode || false,
        includeSecondVariation: schedule.includeAllStyles || true,
        useAI: true,
        outputFormats: ["png", "jpeg"],
        // Aplicar configurações de texto se disponíveis
        ...(schedule.textGenerationSettings || {}),
      }

      // Gerar cards para cada produto
      const results: CardGenerationResult[] = []

      for (const product of products) {
        const result = await this.generateCards(product, baseConfig)
        results.push(result)
      }

      // Atualizar status do agendamento
      await this.updateScheduleStatus(scheduleId, {
        status: "completed",
        lastRun: new Date().toISOString(),
        productCount: products.length,
        results: results.map((r) => ({
          success: r.success,
          productId: r.product?.itemId,
          cardUrls: r.cardUrls,
        })),
      })

      return {
        success: true,
        results,
      }
    } catch (error: any) {
      logger.error(`Erro na execução do agendamento ${scheduleId}`, { error: error.message })

      // Atualizar status do agendamento com erro
      await this.updateScheduleStatus(scheduleId, {
        status: "error",
        lastRun: new Date().toISOString(),
        error: error.message,
      })

      return {
        success: false,
        results: [],
      }
    }
  }

  /**
   * Obtém produtos para processamento em um agendamento
   */
  private async getProductsForSchedule(schedule: any): Promise<any[]> {
    // Em produção, buscaria produtos da API da Shopee
    // Para simplificar, retornamos produtos de exemplo
    return [
      {
        itemId: "123456789",
        productName: "Fone de Ouvido Bluetooth com Cancelamento de Ruído",
        price: "149.90",
        priceDiscountRate: "30",
        sales: "1250",
        ratingStar: "4.8",
        shopName: "Tech Store Oficial",
        freeShipping: true,
      },
      {
        itemId: "987654321",
        productName: "Smartwatch Fitness Tracker à Prova D'água",
        price: "199.90",
        priceDiscountRate: "25",
        sales: "980",
        ratingStar: "4.6",
        shopName: "Gadget World",
        freeShipping: true,
      },
    ].slice(0, schedule.productCount || 1)
  }

  /**
   * Atualiza o status de um agendamento
   */
  private async updateScheduleStatus(scheduleId: string, updates: any): Promise<void> {
    try {
      const redis = await getRedisClient()

      if (!redis) {
        logger.warn("Redis não disponível, status do agendamento não será atualizado")
        return
      }

      // Obter agendamentos
      const schedulesJson = await redis.get(REDIS_KEYS.schedules)
      const schedules = schedulesJson ? JSON.parse(schedulesJson) : []

      // Atualizar agendamento específico
      const updatedSchedules = schedules.map((schedule: any) => {
        if (schedule.id === scheduleId) {
          return { ...schedule, ...updates }
        }
        return schedule
      })

      // Salvar agendamentos atualizados
      await redis.set(REDIS_KEYS.schedules, JSON.stringify(updatedSchedules))

      logger.info(`Status do agendamento ${scheduleId} atualizado com sucesso`, { updates })
    } catch (error) {
      logger.error(`Erro ao atualizar status do agendamento ${scheduleId}`, { error })
    }
  }

  /**
   * Exclui um agendamento
   */
  async deleteSchedule(scheduleId: string): Promise<boolean> {
    try {
      const redis = await getRedisClient()

      if (!redis) {
        logger.warn("Redis não disponível, agendamento não será excluído")
        return false
      }

      // Obter agendamentos
      const schedulesJson = await redis.get(REDIS_KEYS.schedules)
      const schedules = schedulesJson ? JSON.parse(schedulesJson) : []

      // Filtrar agendamento a ser excluído
      const updatedSchedules = schedules.filter((s: any) => s.id !== scheduleId)

      // Salvar agendamentos atualizados
      await redis.set(REDIS_KEYS.schedules, JSON.stringify(updatedSchedules))

      logger.info(`Agendamento ${scheduleId} excluído com sucesso`)
      return true
    } catch (error) {
      logger.error(`Erro ao excluir agendamento ${scheduleId}`, { error })
      return false
    }
  }

  /**
   * Calcula a próxima execução de um agendamento
   */
  calculateNextRun(schedule: any): string {
    const now = new Date()
    const nextRun = new Date()

    // Definir a hora
    const [hours, minutes] = schedule.time.split(":").map(Number)
    nextRun.setHours(hours, minutes, 0, 0)

    // Se a hora já passou hoje, avançar para o próximo dia
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1)
    }

    // Ajustar com base na frequência
    if (schedule.frequency === "daily") {
      // Já está configurado para o próximo dia
    } else if (schedule.frequency === "weekly") {
      // Encontrar o próximo dia da semana válido
      const currentDay = nextRun.getDay()
      const weekdays = schedule.weekdays || [1] // Default: Segunda-feira

      // Ordenar os dias da semana
      const sortedWeekdays = [...weekdays].sort((a, b) => a - b)

      // Encontrar o próximo dia da semana
      let nextWeekday = sortedWeekdays.find((day) => day > currentDay)

      if (nextWeekday === undefined) {
        // Se não houver dias maiores que o atual, pegar o primeiro da lista (próxima semana)
        nextWeekday = sortedWeekdays[0]
        nextRun.setDate(nextRun.getDate() + (7 - currentDay + nextWeekday))
      } else {
        // Avançar para o próximo dia da semana
        nextRun.setDate(nextRun.getDate() + (nextWeekday - currentDay))
      }
    } else if (schedule.frequency === "monthly") {
      // Configurar para o dia do mês especificado
      const dayOfMonth = schedule.dayOfMonth || 1

      // Obter o último dia do mês atual
      const lastDayOfMonth = new Date(nextRun.getFullYear(), nextRun.getMonth() + 1, 0).getDate()

      // Ajustar o dia (limitado ao último dia do mês)
      const targetDay = Math.min(dayOfMonth, lastDayOfMonth)

      // Se o dia já passou neste mês, avançar para o próximo mês
      if (nextRun.getDate() > targetDay) {
        nextRun.setMonth(nextRun.getMonth() + 1)
      }

      nextRun.setDate(targetDay)
    }

    return nextRun.toISOString()
  }
}

// Instância singleton
let unifiedCardServiceInstance: UnifiedCardService | null = null

/**
 * Obtém a instância do serviço unificado de cards
 */
export function getUnifiedCardService(): UnifiedCardService {
  if (!unifiedCardServiceInstance) {
    unifiedCardServiceInstance = new UnifiedCardService()
  }

  return unifiedCardServiceInstance
}
