// Define cache keys for compatibility
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
  LAST_SEARCH: "shopee:last_search",
}

export const REDIS_KEYS = {
  SCHEDULES: "schedules",
}

// Tipos para o armazenamento em memória
export interface MemoryStore {
  videos: any[]
  publishedVideos: any[]
  products: any[]
  processedIds: Set<string>
  descriptions: Map<string, string>
  lastSearch: any[]
}
