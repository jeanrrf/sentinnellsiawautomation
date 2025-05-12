/**
 * Redis constants compatibility layer
 *
 * This file provides constants needed for compatibility
 * with existing code while Redis has been removed.
 */

// Redis keys
export const REDIS_KEYS = {
  PRODUCTS: "products",
  VIDEOS: "videos",
  PUBLISHED_VIDEOS: "published_videos",
  PROCESSED_IDS: "processed_ids",
  DESCRIPTIONS: "descriptions",
  SCHEDULES: "schedules",
  EXECUTION_HISTORY: "execution_history",
}
