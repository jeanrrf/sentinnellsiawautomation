/**
 * Arquivo de compatibilidade para Redis
 * Este arquivo fornece implementações vazias para as funções que eram fornecidas pelo Redis
 * Ele existe apenas para satisfazer as importações existentes no código
 */

import { createLogger } from "./logger"

const logger = createLogger("redis-compatibility")

// Constantes para as chaves do cache (mantidas para compatibilidade)
export const CACHE_KEYS = {
  PRODUCTS: "shopee:products",
  PRODUCT_PREFIX: "shopee:product:",
  DESCRIPTION_PREFIX: "shopee:description:",
  PROCESSED_IDS: "shopee:processed_ids",
  CARDS: "shopee:cards",
  CARD_PREFIX: "shopee:card:",
  PUBLISHED_CARDS: "shopee:published_cards",
  EXCLUDED_PRODUCTS: "shopee:excluded_products",
  VIDEOS: "shopee:videos",
  VIDEO_PREFIX: "shopee:video:",
  SCHEDULES: "schedules",
  SCHEDULE_HISTORY: "execution_history",
}

// Cliente Redis simulado que não faz nada
const mockRedisClient = {
  // Métodos básicos para compatibilidade
  get: async (key: string) => {
    logger.debug(`[MOCK] GET ${key}`)
    return null
  },
  set: async (key: string, value: any, options?: any) => {
    logger.debug(`[MOCK] SET ${key}`)
    return "OK"
  },
  del: async (key: string) => {
    logger.debug(`[MOCK] DEL ${key}`)
    return 1
  },
  exists: async (key: string) => {
    logger.debug(`[MOCK] EXISTS ${key}`)
    return 0
  },
  keys: async (pattern: string) => {
    logger.debug(`[MOCK] KEYS ${pattern}`)
    return []
  },
  // Métodos para conjuntos
  sadd: async (key: string, value: string) => {
    logger.debug(`[MOCK] SADD ${key} ${value}`)
    return 1
  },
  srem: async (key: string, value: string) => {
    logger.debug(`[MOCK] SREM ${key} ${value}`)
    return 1
  },
  smembers: async (key: string) => {
    logger.debug(`[MOCK] SMEMBERS ${key}`)
    return []
  },
  scard: async (key: string) => {
    logger.debug(`[MOCK] SCARD ${key}`)
    return 0
  },
  sismember: async (key: string, value: string) => {
    logger.debug(`[MOCK] SISMEMBER ${key} ${value}`)
    return 0
  },
  // Métodos para hashes
  hget: async (hash: string, key: string) => {
    logger.debug(`[MOCK] HGET ${hash} ${key}`)
    return null
  },
  hset: async (hash: string, key: string, value: any) => {
    logger.debug(`[MOCK] HSET ${hash} ${key}`)
    return 1
  },
  hdel: async (hash: string, key: string) => {
    logger.debug(`[MOCK] HDEL ${hash} ${key}`)
    return 1
  },
  // Outros métodos
  info: async () => {
    return "mock redis info"
  },
  ping: async () => {
    return "PONG"
  },
  pipeline: () => {
    return {
      get: () => this,
      set: () => this,
      exec: async () => [],
    }
  },
}

/**
 * Função para obter o cliente Redis (mantida para compatibilidade)
 * Esta função agora retorna um cliente simulado que não faz nada
 */
export async function getRedisClient() {
  logger.warn("getRedisClient foi chamado, mas o Redis foi removido do sistema")
  return mockRedisClient
}

// Funções de compatibilidade que retornam valores vazios
export async function getVideos() {
  logger.warn("getVideos foi chamado, mas o Redis foi removido do sistema")
  return []
}

export async function saveVideo(videoData: any) {
  logger.warn("saveVideo foi chamado, mas o Redis foi removido do sistema")
  return null
}

export async function getPublishedVideos() {
  logger.warn("getPublishedVideos foi chamado, mas o Redis foi removido do sistema")
  return []
}

export async function getCachedProducts() {
  logger.warn("getCachedProducts foi chamado, mas o Redis foi removido do sistema")
  return []
}

export async function isIdProcessed(productId: string): Promise<boolean> {
  logger.warn("isIdProcessed foi chamado, mas o Redis foi removido do sistema")
  return false
}

export async function addProcessedId(productId: string): Promise<void> {
  logger.warn("addProcessedId foi chamado, mas o Redis foi removido do sistema")
}

export async function getCachedDescription(productId: string): Promise<string | null> {
  logger.warn("getCachedDescription foi chamado, mas o Redis foi removido do sistema")
  return null
}

export async function publishVideo(productId: string): Promise<void> {
  logger.warn("publishVideo foi chamado, mas o Redis foi removido do sistema")
}

export async function cleanupCache(): Promise<void> {
  logger.warn("cleanupCache foi chamado, mas o Redis foi removido do sistema")
}

// Exportação padrão para compatibilidade
const redis = mockRedisClient
export default redis
