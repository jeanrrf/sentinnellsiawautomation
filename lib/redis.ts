import { createLogger } from "./logger"

// Cache keys
export const CACHE_KEYS = {
  PRODUCTS: "products",
  VIDEOS: "videos",
  PUBLISHED_VIDEOS: "published_videos",
  PROCESSED_IDS: "processed_ids",
  DESCRIPTIONS: "descriptions",
}

const logger = createLogger("Redis")

// Mock Redis client para desenvolvimento
const mockRedisClient = {
  get: async (key: string) => {
    logger.debug(`[MOCK] Redis GET: ${key}`)
    return null
  },
  set: async (key: string, value: any, options?: any) => {
    logger.debug(`[MOCK] Redis SET: ${key}`)
    return "OK"
  },
  del: async (key: string) => {
    logger.debug(`[MOCK] Redis DEL: ${key}`)
    return 1
  },
  exists: async (key: string) => {
    logger.debug(`[MOCK] Redis EXISTS: ${key}`)
    return 0
  },
  keys: async (pattern: string) => {
    logger.debug(`[MOCK] Redis KEYS: ${pattern}`)
    return []
  },
  hget: async (key: string, field: string) => {
    logger.debug(`[MOCK] Redis HGET: ${key} ${field}`)
    return null
  },
  hset: async (key: string, field: string, value: any) => {
    logger.debug(`[MOCK] Redis HSET: ${key} ${field}`)
    return 1
  },
  hgetall: async (key: string) => {
    logger.debug(`[MOCK] Redis HGETALL: ${key}`)
    return {}
  },
  sadd: async (key: string, ...members: string[]) => {
    logger.debug(`[MOCK] Redis SADD: ${key}`)
    return members.length
  },
  sismember: async (key: string, member: string) => {
    logger.debug(`[MOCK] Redis SISMEMBER: ${key} ${member}`)
    return 0
  },
  smembers: async (key: string) => {
    logger.debug(`[MOCK] Redis SMEMBERS: ${key}`)
    return []
  },
  expire: async (key: string, seconds: number) => {
    logger.debug(`[MOCK] Redis EXPIRE: ${key} ${seconds}s`)
    return 1
  },
}

/**
 * Obtém uma instância do cliente Redis
 * @returns Cliente Redis configurado
 */
export function getRedisClient() {
  logger.info("Usando cliente Redis mock para desenvolvimento")
  return mockRedisClient
}

/**
 * Obtém a lista de vídeos do cache
 * @returns Array de vídeos ou array vazio se não encontrado
 */
export async function getVideos(): Promise<any[]> {
  logger.info("Obtendo vídeos do cache (mock)")
  return []
}

/**
 * Obtém a lista de vídeos publicados do cache
 * @returns Array de vídeos publicados ou array vazio se não encontrado
 */
export async function getPublishedVideos(): Promise<any[]> {
  logger.info("Obtendo vídeos publicados do cache (mock)")
  return []
}

/**
 * Obtém produtos em cache
 * @returns Produtos em cache ou null se não encontrado
 */
export async function getCachedProducts(): Promise<any | null> {
  logger.info("Obtendo produtos do cache (mock)")
  return null
}

/**
 * Verifica se um ID já foi processado
 * @param id ID a verificar
 * @returns Booleano indicando se o ID foi processado
 */
export async function isIdProcessed(id: string): Promise<boolean> {
  logger.info(`Verificando se ID ${id} foi processado (mock)`)
  return false
}

/**
 * Adiciona um ID à lista de IDs processados
 * @param id ID a adicionar
 * @returns Booleano indicando sucesso
 */
export async function addProcessedId(id: string): Promise<boolean> {
  logger.info(`Adicionando ID ${id} à lista de processados (mock)`)
  return true
}

/**
 * Obtém descrição em cache para um produto
 * @param productId ID do produto
 * @returns Descrição em cache ou null se não encontrada
 */
export async function getCachedDescription(productId: string): Promise<string | null> {
  logger.info(`Obtendo descrição em cache para produto ${productId} (mock)`)
  return null
}

// Exportação padrão do cliente Redis
const redis = mockRedisClient
export default redis
