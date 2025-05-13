/**
 * Constantes para chaves do Redis
 */

// Interface para o armazenamento em memória
export interface MemoryStore {
  [key: string]: any
}

// Chaves para o cache
export const CACHE_KEYS = {
  PRODUCTS: "products",
  PRODUCT_DETAILS: "product_details",
  SEARCH_RESULTS: "search_results",
  GENERATED_CARDS: "generated_cards",
  GENERATED_VIDEOS: "generated_videos",
  USER_PREFERENCES: "user_preferences",
  SYSTEM_STATUS: "system_status",
  TEMPLATES: "templates",
  DESCRIPTIONS: "descriptions",
}

// Chaves para dados persistentes
export const REDIS_KEYS = {
  SCHEDULES: "schedules",
}

// Tempo de expiração padrão (em segundos)
export const DEFAULT_EXPIRATION = 60 * 60 * 24 // 24 horas

// Prefixos para chaves compostas
export const KEY_PREFIXES = {
  PRODUCT: "product:",
  USER: "user:",
  TEMPLATE: "template:",
  CARD: "card:",
  VIDEO: "video:",
}

// Função para criar uma chave composta
export function createKey(prefix: string, id: string): string {
  return `${prefix}${id}`
}

// Função para extrair o ID de uma chave composta
export function extractIdFromKey(key: string, prefix: string): string {
  return key.replace(prefix, "")
}

// Armazenamento em memória para fallback
export const memoryStore: MemoryStore = {}
