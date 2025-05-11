import { createLogger } from "./logger"

const logger = createLogger("RedisFallback")

// Simulação de dados em memória
const inMemoryStore: Record<string, any> = {
  videos: new Set<string>(),
  publishedVideos: new Set<string>(),
  videoData: new Map<string, any>(),
  products: null,
  descriptions: new Map<string, string>(),
  processedIds: new Set<string>(),
  excludedProducts: new Set<string>(),
}

// Estado do fallback
let isActive = false

/**
 * Sistema de fallback para Redis
 * Implementa operações básicas em memória quando o Redis não está disponível
 */
export const redisFallback = {
  /**
   * Ativa o sistema de fallback
   */
  activate: () => {
    isActive = true
    logger.info("Redis fallback system activated")
  },

  /**
   * Desativa o sistema de fallback
   */
  deactivate: () => {
    isActive = false
    logger.info("Redis fallback system deactivated")
  },

  /**
   * Verifica se o fallback está ativo
   */
  isActivated: () => isActive,

  /**
   * Limpa todos os dados em memória
   */
  clearAll: () => {
    inMemoryStore.videos.clear()
    inMemoryStore.publishedVideos.clear()
    inMemoryStore.videoData.clear()
    inMemoryStore.products = null
    inMemoryStore.descriptions.clear()
    inMemoryStore.processedIds.clear()
    inMemoryStore.excludedProducts.clear()
    logger.info("All fallback data cleared")
  },

  /**
   * Obtém vídeos armazenados
   */
  getVideos: () => {
    if (!isActive) return []

    const videos = []
    for (const videoId of inMemoryStore.videos) {
      const videoData = inMemoryStore.videoData.get(videoId)
      if (videoData) {
        videos.push(videoData)
      }
    }
    return videos
  },

  /**
   * Obtém vídeos publicados
   */
  getPublishedVideos: () => {
    if (!isActive) return []

    const videos = []
    for (const videoId of inMemoryStore.publishedVideos) {
      const videoData = inMemoryStore.videoData.get(videoId)
      if (videoData) {
        videos.push(videoData)
      }
    }
    return videos
  },

  /**
   * Publica um vídeo
   */
  publishVideo: (productId: string) => {
    if (!isActive) return false

    const videoData = inMemoryStore.videoData.get(productId)
    if (!videoData) {
      logger.warning(`Video with ID ${productId} not found in fallback storage`)
      return false
    }

    inMemoryStore.videos.delete(productId)
    inMemoryStore.publishedVideos.add(productId)

    // Atualizar dados do vídeo
    videoData.status = "published"
    videoData.publishedAt = new Date().toISOString()
    inMemoryStore.videoData.set(productId, videoData)

    logger.info(`Video ${productId} published in fallback storage`)
    return true
  },

  /**
   * Salva um vídeo
   */
  saveVideo: (videoData: any) => {
    if (!isActive) return false

    const productId = videoData.productId
    if (!productId) {
      logger.warning("Cannot save video without productId in fallback storage")
      return false
    }

    inMemoryStore.videos.add(productId)
    inMemoryStore.videoData.set(productId, videoData)

    logger.info(`Video ${productId} saved in fallback storage`)
    return true
  },

  /**
   * Verifica se um ID foi processado
   */
  isIdProcessed: (productId: string) => {
    if (!isActive) return false
    return inMemoryStore.processedIds.has(productId)
  },

  /**
   * Adiciona um ID processado
   */
  addProcessedId: (productId: string) => {
    if (!isActive) return false
    inMemoryStore.processedIds.add(productId)
    return true
  },

  /**
   * Obtém produtos excluídos
   */
  getExcludedProducts: () => {
    if (!isActive) return []
    return Array.from(inMemoryStore.excludedProducts)
  },

  /**
   * Armazena produtos em cache
   */
  cacheProducts: (products: any[]) => {
    if (!isActive) return false
    inMemoryStore.products = products
    return true
  },

  /**
   * Obtém produtos em cache
   */
  getCachedProducts: () => {
    if (!isActive) return null
    return inMemoryStore.products
  },

  /**
   * Armazena descrição em cache
   */
  cacheDescription: (productId: string, description: string) => {
    if (!isActive) return false
    inMemoryStore.descriptions.set(productId, description)
    return true
  },

  /**
   * Obtém descrição em cache
   */
  getCachedDescription: (productId: string) => {
    if (!isActive) return null
    return inMemoryStore.descriptions.get(productId) || null
  },

  /**
   * Limpa o cache
   */
  cleanupCache: () => {
    if (!isActive) return false
    inMemoryStore.products = null
    inMemoryStore.processedIds.clear()
    return true
  },

  /**
   * Obtém produto em cache
   */
  getCachedProduct: (productId: string) => {
    if (!isActive || !inMemoryStore.products) return null
    return inMemoryStore.products.find((p: any) => p.itemId === productId) || null
  },
}
