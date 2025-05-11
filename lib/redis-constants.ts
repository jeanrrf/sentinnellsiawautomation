/**
 * Constantes para uso com Redis
 */

// Chaves para cache no Redis
export const CACHE_KEYS = {
  PRODUCTS: "products",
  PRODUCT_DETAILS: "product_details",
  SEARCH_RESULTS: "search_results",
  GENERATED_CARDS: "generated_cards",
  GENERATED_DESCRIPTIONS: "generated_descriptions",
  VIDEOS: "videos",
  PUBLISHED_VIDEOS: "published_videos",
  SYSTEM_STATUS: "system_status",
  USER_PREFERENCES: "user_preferences",
  TEMPLATES: "templates",
}

// Chaves para dados persistentes no Redis
export const REDIS_KEYS = {
  SCHEDULES: "schedules",
}

// Interface para armazenamento em memória (fallback)
export interface MemoryStore {
  [key: string]: any
}
