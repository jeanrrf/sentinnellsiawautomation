import { put, del, list } from "@vercel/blob"
import { createLogger } from "./logger"

const logger = createLogger("BlobStorage")

/**
 * Upload a file to Vercel Blob Storage
 * @param buffer The file buffer to upload
 * @param filename The filename to use
 * @returns The URL of the uploaded file or null if upload failed
 */
export async function uploadToBlob(buffer: Buffer | Blob, filename: string): Promise<string | null> {
  try {
    const blob = await put(filename, buffer, {
      access: "public",
      addRandomSuffix: false, // Use exact filename
    })

    logger.info(`File uploaded to Blob Storage: ${blob.url}`)
    return blob.url
  } catch (error) {
    logger.error(`Error uploading file to Blob Storage:`, error)
    return null
  }
}

/**
 * Delete a file from Vercel Blob Storage
 * @param url The URL of the file to delete
 */
export async function deleteFile(url: string): Promise<void> {
  try {
    await del(url)
    logger.info(`File deleted from Blob Storage: ${url}`)
  } catch (error) {
    logger.error(`Error deleting file from Blob Storage:`, error)
    throw error
  }
}

/**
 * Upload a video to Vercel Blob Storage
 * @param buffer The video buffer to upload
 * @param productId The product ID to use in the filename
 * @returns Object with success status, URL, and filename
 */
export async function uploadVideo(
  buffer: Buffer,
  productId: string,
): Promise<{
  success: boolean
  url?: string
  filename?: string
  error?: string
}> {
  try {
    // Generate a unique filename with timestamp
    const timestamp = Date.now()
    const filename = `video_${productId}_${timestamp}.mp4`

    const blob = await put(filename, buffer, {
      access: "public",
      contentType: "video/mp4",
      addRandomSuffix: false,
    })

    logger.info(`Video uploaded to Blob Storage: ${blob.url}`)

    return {
      success: true,
      url: blob.url,
      filename: blob.pathname,
    }
  } catch (error: any) {
    logger.error(`Error uploading video to Blob Storage:`, error)
    return {
      success: false,
      error: error.message || "Unknown error",
    }
  }
}

/**
 * Alias for uploadVideo for backward compatibility
 */
export const uploadVideoToBlob = uploadVideo

/**
 * Delete a video from Vercel Blob Storage
 * @param url The URL of the video to delete
 * @returns Object with success status and message
 */
export async function deleteVideo(url: string): Promise<{
  success: boolean
  message: string
}> {
  try {
    await del(url)
    logger.info(`Video deleted from Blob Storage: ${url}`)

    return {
      success: true,
      message: "Video deleted successfully",
    }
  } catch (error: any) {
    logger.error(`Error deleting video from Blob Storage:`, error)
    return {
      success: false,
      message: error.message || "Unknown error",
    }
  }
}

/**
 * List all blobs with a specific prefix
 * @param prefix The prefix to filter by
 * @returns Array of blob objects
 */
export async function listBlobs(prefix = ""): Promise<any[]> {
  try {
    const { blobs } = await list({ prefix })
    return blobs
  } catch (error) {
    logger.error(`Error listing blobs with prefix ${prefix}:`, error)
    return []
  }
}

/**
 * Tests the Blob Storage connection and functionality
 * @returns Object with test results
 */
export async function testBlobStorage(): Promise<{
  success: boolean
  message: string
  details?: any
}> {
  try {
    // Create a small test file
    const testContent = Buffer.from("Blob Storage Test")
    const testFilename = `test-${Date.now()}.txt`

    // Upload test file
    const blob = await put(testFilename, testContent, {
      access: "public",
      addRandomSuffix: true,
    })

    // Delete test file
    await del(blob.url)

    return {
      success: true,
      message: "Blob Storage is working correctly",
      details: {
        testUrl: blob.url,
        testSize: blob.size,
      },
    }
  } catch (error: any) {
    logger.error("Error testing Blob Storage:", error)
    return {
      success: false,
      message: `Blob Storage test failed: ${error.message}`,
      details: error,
    }
  }
}
