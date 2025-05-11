// Definição das chaves de cache do Redis
export const CACHE_KEYS = {
  // Produtos
  PRODUCTS: "shopee:products",
  PRODUCT_PREFIX: "shopee:product:",

  // Descrições
  DESCRIPTION_PREFIX: "shopee:description:",

  // IDs processados
  PROCESSED_IDS: "shopee:processed_ids",

  // Cards
  CARDS: "shopee:cards",
  CARD_PREFIX: "shopee:card:",
  PUBLISHED_CARDS: "shopee:published_cards",

  // Produtos excluídos
  EXCLUDED_PRODUCTS: "shopee:excluded_products",

  // Vídeos
  VIDEOS: "shopee:videos",
  VIDEO_PREFIX: "shopee:video:",
  PUBLISHED_VIDEOS: "shopee:published_videos",

  // Agendamentos
  SCHEDULES: "shopee:schedules",

  // Configurações
  SETTINGS: "shopee:settings",

  // Estatísticas
  STATS: "shopee:stats",

  // Tokens e autenticação
  AUTH_TOKENS: "shopee:auth_tokens",

  // Logs
  LOGS: "shopee:logs",
}

// TTLs em segundos
export const CACHE_TTL = {
  PRODUCTS: 60 * 60, // 1 hora
  DESCRIPTIONS: 60 * 60 * 24, // 24 horas
  PROCESSED_IDS: 60 * 60 * 24 * 7, // 7 dias
  PUBLISHED_CARDS: 60 * 60 * 24 * 30, // 30 dias
  EXCLUDED_PRODUCTS: 60 * 60 * 24 * 90, // 90 dias
  CARDS: 60 * 60 * 24 * 30, // 30 dias
  VIDEOS: 60 * 60 * 24 * 30, // 30 dias
  SCHEDULES: 60 * 60 * 24 * 30, // 30 dias
  SETTINGS: 60 * 60 * 24 * 365, // 1 ano
  AUTH_TOKENS: 60 * 60 * 24 * 7, // 7 dias
}

// Códigos de erro
export const ERROR_CODES = {
  REDIS_CONNECTION_FAILED: "REDIS_CONNECTION_FAILED",
  REDIS_OPERATION_FAILED: "REDIS_OPERATION_FAILED",
  REDIS_NOT_CONFIGURED: "REDIS_NOT_CONFIGURED",
}

// Configurações padrão
export const DEFAULT_SETTINGS = {
  CACHE_ENABLED: true,
  AUTO_CLEANUP_ENABLED: true,
  MAX_CACHE_SIZE: 1000,
  MAX_PRODUCTS_PER_REQUEST: 50,
}
