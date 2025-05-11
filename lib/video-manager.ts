import { createLogger } from "./logger"
import { getVideos, getPublishedVideos } from "./redis"
import { deleteVideo } from "./blob-storage"
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

    // Delete each old video
    for (const video of oldVideos) {
      try {
        if (video.url) {
          const result = await deleteVideo(video.url)

          if (result.success) {
            deletedCount++
            logger.info(`Successfully deleted old video: ${video.url}`)
          } else {
            errors.push(`Failed to delete video ${video.productId}: ${result.message}`)
          }
        }
      } catch (error: any) {
        errors.push(`Error processing video ${video.productId}: ${error.message}`)
        logger.error(`Error during video cleanup for ${video.productId}:`, error)
      }
    }

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

    // Process each file
    for (const file of files) {
      try {
        const filePath = path.join(directory, file)

        // Skip if it's a directory
        if (fs.statSync(filePath).isDirectory()) continue

        // Check file age
        const stats = fs.statSync(filePath)
        const fileTime = stats.mtime.getTime()

        if (fileTime < cutoffTime) {
          // Delete the file
          fs.unlinkSync(filePath)
          deletedCount++
          logger.debug(`Deleted temp file: ${filePath}`)
        }
      } catch (error: any) {
        errors.push(`Error processing file ${file}: ${error.message}`)
        logger.error(`Error during temp file cleanup for ${file}:`, error)
      }
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
