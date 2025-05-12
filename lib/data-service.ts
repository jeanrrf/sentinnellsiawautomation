/**
 * Data Service
 *
 * Provides a unified interface for data access without using Redis or any persistent cache.
 * All data is stored in memory and will be lost when the server restarts.
 */

import { createLogger } from "./logger"

const logger = createLogger("DataService")

// In-memory storage
const memoryStore: Record<string, any> = {}

/**
 * Get data from memory store
 */
export async function getData(key: string): Promise<any> {
  logger.debug(`Getting data for key: ${key}`)
  return memoryStore[key] || null
}

/**
 * Set data in memory store
 */
export async function setData(key: string, data: any): Promise<void> {
  logger.debug(`Setting data for key: ${key}`)
  memoryStore[key] = data
}

/**
 * Delete data from memory store
 */
export async function deleteData(key: string): Promise<void> {
  logger.debug(`Deleting data for key: ${key}`)
  delete memoryStore[key]
}

/**
 * Check if key exists in memory store
 */
export async function hasData(key: string): Promise<boolean> {
  return key in memoryStore
}

/**
 * Get all keys in memory store
 */
export async function getAllKeys(): Promise<string[]> {
  return Object.keys(memoryStore)
}

/**
 * Clear all data in memory store
 */
export async function clearAllData(): Promise<void> {
  logger.warn("Clearing all data from memory store")
  Object.keys(memoryStore).forEach((key) => {
    delete memoryStore[key]
  })
}

/**
 * Get videos from memory store
 */
export async function getVideos(): Promise<any[]> {
  return (await getData("videos")) || []
}

/**
 * Get published videos from memory store
 */
export async function getPublishedVideos(): Promise<any[]> {
  return (await getData("published_videos")) || []
}

/**
 * Get products from memory store
 */
export async function getProducts(): Promise<any[]> {
  return (await getData("products")) || []
}

/**
 * Get schedules from memory store
 */
export async function getSchedules(): Promise<any[]> {
  return (await getData("schedules")) || []
}

/**
 * Get execution history from memory store
 */
export async function getExecutionHistory(): Promise<any[]> {
  return (await getData("execution_history")) || []
}

/**
 * Check if ID has been processed
 */
export async function isIdProcessed(id: string): Promise<boolean> {
  const processedIds = (await getData("processed_ids")) || []
  return processedIds.includes(id)
}

/**
 * Add processed ID
 */
export async function addProcessedId(id: string): Promise<void> {
  const processedIds = (await getData("processed_ids")) || []
  if (!processedIds.includes(id)) {
    processedIds.push(id)
    await setData("processed_ids", processedIds)
  }
}

/**
 * Get description for product
 */
export async function getDescription(productId: string): Promise<string | null> {
  const descriptions = (await getData("descriptions")) || {}
  return descriptions[productId] || null
}

/**
 * Set description for product
 */
export async function setDescription(productId: string, description: string): Promise<void> {
  const descriptions = (await getData("descriptions")) || {}
  descriptions[productId] = description
  await setData("descriptions", descriptions)
}
