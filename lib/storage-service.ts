/**
 * Serviço de armazenamento temporário sem persistência
 * Este serviço fornece funcionalidades básicas de armazenamento sem cache ou persistência
 */

import { createLogger } from "./logger"

const logger = createLogger("storage-service")

// Interface para dados de vídeo
export interface VideoData {
  id: string
  productId: string
  createdAt: string
  status: string
  blobUrl?: string
  duration?: number
}

// Interface para dados de produto
export interface ProductData {
  itemId: string
  productName: string
  price: string | number
  sales: number
  imageUrl?: string
  ratingStar?: string
}

// Interface para dados de agendamento
export interface Schedule {
  id: string
  date: string
  time: string
  frequency: string
  status: string
  type?: string
  lastRun?: string
  productCount?: number
  generatedCards?: string[]
  errors?: string[]
}

// Armazenamento temporário em memória (apenas para a sessão atual)
// Não é persistente entre recarregamentos da página ou reinicializações do servidor
class TemporaryStorage {
  private videos: Map<string, VideoData> = new Map()
  private products: ProductData[] = []
  private schedules: Schedule[] = []
  private processedIds: Set<string> = new Set()
  private descriptions: Map<string, string> = new Map()

  // Métodos para vídeos
  async getVideos(): Promise<VideoData[]> {
    return Array.from(this.videos.values())
  }

  async saveVideo(videoData: VideoData): Promise<void> {
    this.videos.set(videoData.id, videoData)
    logger.info(`Vídeo ${videoData.id} salvo temporariamente`)
  }

  async deleteVideo(videoId: string): Promise<void> {
    this.videos.delete(videoId)
    logger.info(`Vídeo ${videoId} excluído`)
  }

  // Métodos para produtos
  async getProducts(): Promise<ProductData[]> {
    return [...this.products]
  }

  async saveProducts(products: ProductData[]): Promise<void> {
    this.products = [...products]
    logger.info(`${products.length} produtos salvos temporariamente`)
  }

  // Métodos para IDs processados
  async isIdProcessed(id: string): Promise<boolean> {
    return this.processedIds.has(id)
  }

  async addProcessedId(id: string): Promise<void> {
    this.processedIds.add(id)
  }

  // Métodos para descrições
  async getDescription(productId: string): Promise<string | null> {
    return this.descriptions.get(productId) || null
  }

  async saveDescription(productId: string, description: string): Promise<void> {
    this.descriptions.set(productId, description)
  }

  // Métodos para agendamentos
  async getSchedules(): Promise<Schedule[]> {
    return [...this.schedules]
  }

  async saveSchedule(schedule: Schedule): Promise<void> {
    const existingIndex = this.schedules.findIndex((s) => s.id === schedule.id)

    if (existingIndex >= 0) {
      // Atualizar agendamento existente
      this.schedules[existingIndex] = schedule
    } else {
      // Adicionar novo agendamento
      this.schedules.push(schedule)
    }

    logger.info(`Agendamento ${schedule.id} salvo temporariamente`)
  }

  async deleteSchedule(scheduleId: string): Promise<void> {
    this.schedules = this.schedules.filter((s) => s.id !== scheduleId)
    logger.info(`Agendamento ${scheduleId} excluído`)
  }

  // Limpar todos os dados
  async clearAll(): Promise<void> {
    this.videos.clear()
    this.products = []
    this.schedules = []
    this.processedIds.clear()
    this.descriptions.clear()
    logger.info("Todos os dados foram limpos")
  }
}

// Instância única do serviço de armazenamento
const storageService = new TemporaryStorage()

export default storageService
