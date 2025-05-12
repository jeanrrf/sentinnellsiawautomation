/**
 * Redis compatibility layer
 *
 * This file provides empty implementations of Redis functions
 * to maintain compatibility with existing code while Redis has been removed.
 */

import { createLogger } from "./logger"

const logger = createLogger("RedisCompat")

// Mock Redis client
const mockRedisClient = {
  get: async () => null,
  set: async () => "OK",
  del: async () => 1,
  exists: async () => 0,
  keys: async () => [],
  hget: async () => null,
  hset: async () => "OK",
  hgetall: async () => ({}),
  sadd: async () => 1,
  sismember: async () => 0,
  smembers: async () => [],
  expire: async () => 1,
}

// Cache keys
export const CACHE_KEYS = {
  PRODUCTS: "products",
  VIDEOS: "videos",
  PUBLISHED_VIDEOS: "published_videos",
  PROCESSED_IDS: "processed_ids",
  DESCRIPTIONS: "descriptions",
}

// Get Redis client (returns mock client)
export function getRedisClient() {
  logger.warn("Redis has been removed. Using mock implementation.")
  return mockRedisClient
}

// Get videos from cache (returns empty array)
export async function getVideos() {
  logger.warn("Redis has been removed. getVideos returning empty array.")
  return []
}

// Get published videos from cache (returns empty array)
export async function getPublishedVideos() {
  logger.warn("Redis has been removed. getPublishedVideos returning empty array.")
  return []
}

// Get cached products (returns null)
export async function getCachedProducts() {
  logger.warn("Redis has been removed. getCachedProducts returning null.")
  return null
}

// Check if ID is processed (returns false)
export async function isIdProcessed(id: string) {
  logger.warn(`Redis has been removed. isIdProcessed returning false for id: ${id}`)
  return false
}

// Add processed ID (does nothing)
export async function addProcessedId(id: string) {
  logger.warn(`Redis has been removed. addProcessedId doing nothing for id: ${id}`)
  return true
}

// Get cached description (returns null)
export async function getCachedDescription(productId: string) {
  logger.warn(`Redis has been removed. getCachedDescription returning null for productId: ${productId}`)
  return null
}

// Default export (mock Redis client)
const redis = mockRedisClient
export default redis
