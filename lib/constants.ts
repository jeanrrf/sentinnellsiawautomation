/**
 * Constantes para o sistema
 */

// Constantes para tipos de agendamento
export const SCHEDULE_TYPES = {
  STANDARD: "standard",
  AUTO_DOWNLOAD: "auto-download",
}

// Constantes para status de agendamento
export const SCHEDULE_STATUS = {
  PENDING: "pending",
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
}

// Constantes para frequência de agendamento
export const SCHEDULE_FREQUENCY = {
  ONCE: "once",
  DAILY: "daily",
  WEEKLY: "weekly",
}

// Constantes para status de vídeo
export const VIDEO_STATUS = {
  GENERATED: "generated",
  PUBLISHED: "published",
  FAILED: "failed",
}

// Constantes para tipos de erro
export const ERROR_TYPES = {
  API: "api_error",
  VALIDATION: "validation_error",
  SYSTEM: "system_error",
  NETWORK: "network_error",
}

// Constantes para tipos de notificação
export const NOTIFICATION_TYPES = {
  SUCCESS: "success",
  ERROR: "error",
  WARNING: "warning",
  INFO: "info",
}

// Constantes para tipos de mídia
export const MEDIA_TYPES = {
  IMAGE: "image",
  VIDEO: "video",
  AUDIO: "audio",
}

// Constantes para formatos de exportação
export const EXPORT_FORMATS = {
  PNG: "png",
  JPG: "jpg",
  MP4: "mp4",
  GIF: "gif",
}

// Constantes para temas
export const THEMES = {
  LIGHT: "light",
  DARK: "dark",
  SYSTEM: "system",
}

// Constantes para tamanhos de tela
export const SCREEN_SIZES = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  XXL: 1536,
}

// Constantes para limites do sistema
export const SYSTEM_LIMITS = {
  MAX_PRODUCTS: 100,
  MAX_SCHEDULES: 50,
  MAX_VIDEOS: 200,
}

// Constantes para tempos de expiração (em segundos)
export const EXPIRATION_TIMES = {
  SHORT: 60 * 5, // 5 minutos
  MEDIUM: 60 * 60, // 1 hora
  LONG: 60 * 60 * 24, // 1 dia
  VERY_LONG: 60 * 60 * 24 * 7, // 1 semana
}

// Constantes para rotas da API
export const API_ROUTES = {
  PRODUCTS: "/api/products",
  VIDEOS: "/api/videos",
  SCHEDULES: "/api/schedule",
  SYSTEM_STATUS: "/api/system-status",
  CRON: "/api/cron",
}

// Constantes para rotas de páginas
export const PAGE_ROUTES = {
  HOME: "/",
  DASHBOARD: "/dashboard",
  MONITORING: "/dashboard/monitoring",
  SCHEDULER: "/dashboard/scheduler",
}
