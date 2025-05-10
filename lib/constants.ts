// Chaves de cache
export const CACHE_KEYS = {
  PRODUCTS: "products",
  PROCESSED_IDS: "processed_ids",
  DESCRIPTION_PREFIX: "description",
  VIDEO_PREFIX: "video",
  PUBLISHED_VIDEOS: "published_videos",
}

// Formatos de vídeo
export const VIDEO_FORMATS = {
  PORTRAIT: "portrait",
  LANDSCAPE: "landscape",
  SQUARE: "square",
}

// Qualidades de vídeo
export const VIDEO_QUALITIES = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
}

// Caminhos
export const PATHS = {
  TEMP: process.env.TEMP_DIR || "/tmp",
  UPLOADS: "/uploads",
  VIDEOS: "/videos",
}

// Configurações padrão
export const DEFAULT_CONFIG = {
  DURATION: 10,
  FPS: 30,
  QUALITY: VIDEO_QUALITIES.MEDIUM,
  FORMAT: VIDEO_FORMATS.PORTRAIT,
}

// Endpoints da API
export const API_ENDPOINTS = {
  SHOPEE: "/api/fetch-shopee",
  GENERATE_VIDEO: "/api/generate-video",
  SAVE_VIDEO: "/api/save-video",
  PUBLISH_VIDEO: "/api/publish-video",
  PRODUCTS: "/api/products",
}
