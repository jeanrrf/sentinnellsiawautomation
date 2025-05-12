import { createLogger } from "./logger"
import { getVideos, getPublishedVideos } from "./redis"
import { deleteVideo, listBlobs } from "./blob-storage"
import fs from "fs"
import path from "path"

const logger = createLogger("VideoManager")

/**
 * Cleans up old videos from Blob Storage
 * @param olderThanDays Delete videos older than this many days
 * @returns Object with success status and details
 */
export async function cleanupOldVideos(olderThanDays = 30): Promise<{
  success: boolean
  deletedCount: number
  errors: string[]
}> {
  logger.info(`Starting cleanup of videos older than ${olderThanDays} days`)

  const errors: string[] = []
  let deletedCount = 0

  try {
    // Get all videos (both published and unpublished)
    const videos = [...(await getVideos()), ...(await getPublishedVideos())]

    if (!videos || videos.length === 0) {
      logger.info("No videos found to clean up")
      return { success: true, deletedCount: 0, errors: [] }
    }

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

    // Find videos older than the cutoff date
    const oldVideos = videos.filter((video) => {
      if (!video.createdAt) return false

      const videoDate = new Date(video.createdAt)
      return videoDate < cutoffDate
    })

    logger.info(`Found ${oldVideos.length} videos older than ${olderThanDays} days`)

    // Use Promise.allSettled for parallel processing with error handling
    const deletePromises = oldVideos.map(async (video) => {
      try {
        if (video.url) {
          const result = await deleteVideo(video.url)
          if (result.success) {
            logger.info(`Successfully deleted old video: ${video.url}`)
            return { success: true, id: video.productId }
          } else {
            throw new Error(result.message)
          }
        }
        return { success: false, id: video.productId, error: "No URL found" }
      } catch (error: any) {
        return { success: false, id: video.productId, error: error.message }
      }
    })

    const results = await Promise.allSettled(deletePromises)

    // Process results
    results.forEach((result) => {
      if (result.status === "fulfilled") {
        if (result.value.success) {
          deletedCount++
        } else {
          errors.push(`Failed to delete video ${result.value.id}: ${result.value.error}`)
        }
      } else {
        errors.push(`Error in promise: ${result.reason}`)
      }
    })

    logger.info(`Video cleanup completed. Deleted: ${deletedCount}, Errors: ${errors.length}`)
    return {
      success: errors.length === 0,
      deletedCount,
      errors,
    }
  } catch (error: any) {
    logger.error("Error during video cleanup:", error)
    return {
      success: false,
      deletedCount,
      errors: [...errors, `General error: ${error.message}`],
    }
  }
}

/**
 * Cleans up temporary files from the filesystem
 * @param directory The directory to clean
 * @param olderThanHours Delete files older than this many hours
 * @returns Object with success status and details
 */
export async function cleanupTempFiles(
  directory: string = process.env.TEMP_DIR || "/tmp",
  olderThanHours = 24,
): Promise<{
  success: boolean
  deletedCount: number
  errors: string[]
}> {
  logger.info(`Starting cleanup of temp files in ${directory} older than ${olderThanHours} hours`)

  const errors: string[] = []
  let deletedCount = 0

  try {
    // Check if directory exists
    if (!fs.existsSync(directory)) {
      logger.info(`Directory ${directory} does not exist, nothing to clean`)
      return { success: true, deletedCount: 0, errors: [] }
    }

    // Read directory contents
    const files = fs.readdirSync(directory)

    if (files.length === 0) {
      logger.info(`No files found in ${directory}`)
      return { success: true, deletedCount: 0, errors: [] }
    }

    const cutoffTime = Date.now() - olderThanHours * 60 * 60 * 1000

    // Process files in batches to avoid memory issues with large directories
    const BATCH_SIZE = 100
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const batch = files.slice(i, i + BATCH_SIZE)

      // Process batch in parallel
      const deletePromises = batch.map(async (file) => {
        try {
          const filePath = path.join(directory, file)

          // Skip if it's a directory
          if (fs.statSync(filePath).isDirectory()) {
            return { success: true, skipped: true }
          }

          // Check file age
          const stats = fs.statSync(filePath)
          const fileTime = stats.mtime.getTime()

          if (fileTime < cutoffTime) {
            // Delete the file
            fs.unlinkSync(filePath)
            logger.debug(`Deleted temp file: ${filePath}`)
            return { success: true, deleted: true }
          }

          return { success: true, skipped: true, tooNew: true }
        } catch (error: any) {
          return { success: false, file, error: error.message }
        }
      })

      const results = await Promise.allSettled(deletePromises)

      // Process results
      results.forEach((result) => {
        if (result.status === "fulfilled") {
          if (result.value.success && result.value.deleted) {
            deletedCount++
          } else if (!result.value.success) {
            errors.push(`Error processing file ${result.value.file}: ${result.value.error}`)
          }
        } else {
          errors.push(`Error in promise: ${result.reason}`)
        }
      })
    }

    logger.info(`Temp file cleanup completed. Deleted: ${deletedCount}, Errors: ${errors.length}`)
    return {
      success: errors.length === 0,
      deletedCount,
      errors,
    }
  } catch (error: any) {
    logger.error("Error during temp file cleanup:", error)
    return {
      success: false,
      deletedCount,
      errors: [...errors, `General error: ${error.message}`],
    }
  }
}

/**
 * Find orphaned blobs that are not referenced in Redis
 * @param prefix The blob prefix to check
 * @returns Object with orphaned blobs
 */
export async function findOrphanedBlobs(prefix = "video_"): Promise<{
  success: boolean
  orphanedBlobs: string[]
  error?: string
}> {
  try {
    // Get all blobs with the given prefix
    const blobs = await listBlobs(prefix)

    // Get all videos from Redis
    const videos = [...(await getVideos()), ...(await getPublishedVideos())]

    // Extract URLs from videos
    const videoUrls = new Set(videos.map((video) => video.url).filter(Boolean))

    // Find blobs that are not in Redis
    const orphanedBlobs = blobs.filter((blob) => !videoUrls.has(blob.url)).map((blob) => blob.url)

    logger.info(`Found ${orphanedBlobs.length} orphaned blobs with prefix ${prefix}`)

    return {
      success: true,
      orphanedBlobs,
    }
  } catch (error: any) {
    logger.error("Error finding orphaned blobs:", error)
    return {
      success: false,
      orphanedBlobs: [],
      error: error.message,
    }
  }
}

/**
 * Delete orphaned blobs
 * @param urls Array of blob URLs to delete
 * @returns Object with deletion results
 */
export async function deleteOrphanedBlobs(urls: string[]): Promise<{
  success: boolean
  deletedCount: number
  errors: string[]
}> {
  const errors: string[] = []
  let deletedCount = 0

  try {
    if (urls.length === 0) {
      return { success: true, deletedCount: 0, errors: [] }
    }

    logger.info(`Attempting to delete ${urls.length} orphaned blobs`)

    // Delete blobs in batches to avoid rate limits
    const BATCH_SIZE = 10
    for (let i = 0; i < urls.length; i += BATCH_SIZE) {
      const batch = urls.slice(i, i + BATCH_SIZE)

      // Process batch in parallel
      const deletePromises = batch.map(async (url) => {
        try {
          const result = await deleteVideo(url)
          return { url, success: result.success, message: result.message }
        } catch (error: any) {
          return { url, success: false, message: error.message }
        }
      })

      const results = await Promise.all(deletePromises)

      // Process results
      results.forEach((result) => {
        if (result.success) {
          deletedCount++
        } else {
          errors.push(`Failed to delete ${result.url}: ${result.message}`)
        }
      })

      // Add a small delay between batches to avoid rate limits
      if (i + BATCH_SIZE < urls.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    logger.info(`Deleted ${deletedCount} orphaned blobs with ${errors.length} errors`)

    return {
      success: errors.length === 0,
      deletedCount,
      errors,
    }
  } catch (error: any) {
    logger.error("Error deleting orphaned blobs:", error)
    return {
      success: false,
      deletedCount,
      errors: [...errors, `General error: ${error.message}`],
    }
  }
}
