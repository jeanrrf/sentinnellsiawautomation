"use server"

import { Redis as UpstashRedis } from "@upstash/redis"
import { createLogger } from "./logger"
import { CACHE_KEYS, type MemoryStore } from "./redis-constants"

const logger = createLogger("redis")

// Initialize Redis client
let redis: UpstashRedis | null = null

try {
  const REDIS_URL = process.env.KV_REST_API_URL || process.env.REDIS_URL
  const REDIS_TOKEN = process.env.KV_REST_API_TOKEN

  if (REDIS_URL && REDIS_TOKEN) {
    redis = new UpstashRedis({
      url: REDIS_URL,
      token: REDIS_TOKEN,
    })
    logger.info("Cliente Redis inicializado com sucesso")
  } else {
    logger.warn("Variáveis de ambiente Redis não configuradas")
  }
} catch (error) {
  logger.error("Erro ao inicializar cliente Redis:", error)
}

// In-memory storage as alternative to Redis
const memoryStore: MemoryStore = {
  videos: [],
  publishedVideos: [],
  products: [],
  processedIds: new Set<string>(),
  descriptions: new Map<string, string>(),
  lastSearch: [],
}

// Função para obter as chaves de cache
export async function getCacheKeys() {
  return CACHE_KEYS
}

// Implementation of required exports that don't use Redis
export async function getVideos(): Promise<any[]> {
  logger.info("Obtendo vídeos (sem Redis)")
  return memoryStore.videos
}

export async function getPublishedVideos(): Promise<any[]> {
  logger.info("Obtendo vídeos publicados (sem Redis)")
  return memoryStore.publishedVideos
}

export async function getCachedProducts(): Promise<any[]> {
  logger.info("Obtendo produtos em cache (sem Redis)")

  // If we have products in memory, return them
  if (memoryStore.products.length > 0) {
    return memoryStore.products
  }

  // Otherwise, try to fetch from API
  try {
    const response = await fetch("/api/products")
    if (response.ok) {
      const data = await response.json()
      if (data.products && Array.isArray(data.products)) {
        memoryStore.products = data.products
        return data.products
      }
    }
  } catch (error) {
    logger.error("Erro ao buscar produtos da API:", error)
  }

  return []
}

export async function getRedisClient() {
  logger.warn("getRedisClient chamado, mas Redis não está sendo usado")
  return redis
}

export async function isIdProcessed(productId: string): Promise<boolean> {
  return memoryStore.processedIds.has(productId)
}

export async function addProcessedId(productId: string): Promise<void> {
  memoryStore.processedIds.add(productId)
  logger.info(`ID ${productId} adicionado à lista de processados (sem Redis)`)
}

export async function getCachedDescription(productId: string): Promise<string | null> {
  return memoryStore.descriptions.get(productId) || null
}

export async function cacheDescription(productId: string, description: string): Promise<void> {
  memoryStore.descriptions.set(productId, description)
  logger.info(`Descrição para produto ${productId} armazenada (sem Redis)`)
}

export async function publishVideo(productId: string): Promise<void> {
  const videoIndex = memoryStore.videos.findIndex((v: any) => v.productId === productId)
  if (videoIndex >= 0) {
    const video = memoryStore.videos[videoIndex]
    video.publishedAt = new Date().toISOString()
    memoryStore.publishedVideos.push(video)
    memoryStore.videos.splice(videoIndex, 1)
    logger.info(`Vídeo ${productId} publicado (sem Redis)`)
  } else {
    throw new Error(`Vídeo com ID ${productId} não encontrado`)
  }
}

export async function saveVideo(videoData: any): Promise<void> {
  memoryStore.videos.push({
    ...videoData,
    createdAt: new Date().toISOString(),
  })
  logger.info(`Vídeo ${videoData.productId} salvo (sem Redis)`)
}

export async function getLastSearchResults(): Promise<any[]> {
  return memoryStore.lastSearch
}

export async function saveLastSearchResults(products: any[]): Promise<void> {
  memoryStore.lastSearch = [...products]
  logger.info(`${products.length} produtos da última pesquisa salvos (sem Redis)`)
}

export async function cleanupCache(): Promise<void> {
  memoryStore.products = []
  memoryStore.processedIds.clear()
  memoryStore.descriptions.clear()
  logger.info("Cache limpo (sem Redis)")
}

export async function getCachedProduct(productId: string): Promise<any | null> {
  const product = memoryStore.products.find((p: any) => p.itemId === productId)
  return product || null
}

export { redis, CACHE_KEYS }
export default redis
