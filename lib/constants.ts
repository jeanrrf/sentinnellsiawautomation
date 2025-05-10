// Importando CACHE_KEYS de redis.ts
import { CACHE_KEYS } from "./redis"

// Re-exportando CACHE_KEYS
export { CACHE_KEYS }

// Outras constantes do sistema
export const VIDEO_FORMATS = {
  PORTRAIT: "portrait",
  LANDSCAPE: "landscape",
  SQUARE: "square",
}

export const VIDEO_QUALITIES = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
}

export const SYSTEM_PATHS = {
  TEMP: process.env.TEMP_DIR || "/tmp",
  UPLOADS: "/uploads",
  VIDEOS: "/videos",
}

export const DEFAULT_SETTINGS = {
  VIDEO_DURATION: 10,
  FPS: 30,
  QUALITY: VIDEO_QUALITIES.MEDIUM,
  FORMAT: VIDEO_FORMATS.PORTRAIT,
}

export const API_ENDPOINTS = {
  SHOPEE: process.env.SHOPEE_AFFILIATE_API_URL || "https://open-api.affiliate.shopee.com.br",
  GENERATE_VIDEO: "/api/generate-video",
  SAVE_VIDEO: "/api/save-video",
  PUBLISH_VIDEO: "/api/publish-video",
  PRODUCTS: "/api/products",
}
