import { put, del } from "@vercel/blob"
import { createLogger, ErrorCodes } from "./logger"

const logger = createLogger("BlobStorage")

// Function to upload a file to Vercel Blob Storage
export async function uploadToBlob(buffer: Buffer | Blob, filename: string): Promise<string | null> {
  logger.debug("Starting upload to Blob Storage", {
    context: { filename },
  })

  try {
    // Upload the file
    const blob = await put(filename, buffer, {
      access: "public",
    })

    logger.info("Upload to Blob Storage completed successfully", {
      context: { url: blob.url },
    })

    return blob.url
  } catch (error: any) {
    logger.error("Failed to upload to Blob Storage", {
      code: ErrorCodes.STORAGE.BLOB_UPLOAD_FAILED,
      details: error,
    })
    return null
  }
}

// Function to delete a file from Vercel Blob Storage
export async function deleteFile(url: string): Promise<void> {
  logger.debug("Starting deletion from Blob Storage", {
    context: { url },
  })

  try {
    await del(url)
    logger.info("Deletion from Blob Storage completed successfully", {
      context: { url },
    })
  } catch (error) {
    logger.error("Failed to delete from Blob Storage", {
      code: ErrorCodes.STORAGE.DELETE_FAILED,
      details: error,
    })
    throw error
  }
}

/**
 * Uploads a video to Vercel Blob Storage
 * @param buffer The video buffer to upload
 * @param productId The product ID to use in the filename
 * @returns Object with success status, URL, and filename
 */
export async function uploadVideoToBlob(
  buffer: Buffer,
  productId: string,
): Promise<{
  success: boolean
  url?: string
  filename?: string
  error?: string
}> {
  logger.debug("Starting video upload to Blob Storage", {
    context: { productId, bufferSize: buffer.length },
  })

  try {
    // Generate a unique filename with timestamp
    const timestamp = Date.now()
    const filename = `videos/${productId}-${timestamp}.mp4`

    // Upload the video
    const url = await uploadToBlob(buffer, filename)

    if (!url) {
      throw new Error("Failed to upload video to Blob Storage")
    }

    logger.info("Video uploaded to Blob Storage successfully", {
      context: { productId, url, filename },
    })

    return {
      success: true,
      url,
      filename,
    }
  } catch (error: any) {
    logger.error("Failed to upload video to Blob Storage", {
      code: ErrorCodes.STORAGE.BLOB_UPLOAD_FAILED,
      details: error,
    })

    return {
      success: false,
      error: error.message || "Unknown error during video upload",
    }
  }
}

/**
 * Uploads a video to Vercel Blob Storage
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
  logger.debug("Starting video upload to Blob Storage", {
    context: { productId, bufferSize: buffer.length },
  })

  try {
    // Generate a unique filename with timestamp
    const timestamp = Date.now()
    const filename = `videos/${productId}-${timestamp}.mp4`

    // Upload the video
    const url = await uploadToBlob(buffer, filename)

    if (!url) {
      throw new Error("Failed to upload video to Blob Storage")
    }

    logger.info("Video uploaded to Blob Storage successfully", {
      context: { productId, url, filename },
    })

    return {
      success: true,
      url,
      filename,
    }
  } catch (error: any) {
    logger.error("Failed to upload video to Blob Storage", {
      code: ErrorCodes.STORAGE.BLOB_UPLOAD_FAILED,
      details: error,
    })

    return {
      success: false,
      error: error.message || "Unknown error during video upload",
    }
  }
}

/**
 * Deletes a video from Vercel Blob Storage
 * @param url The URL of the video to delete
 * @returns Object with success status and message
 */
export async function deleteVideo(url: string): Promise<{
  success: boolean
  message: string
}> {
  logger.debug("Starting video deletion from Blob Storage", {
    context: { url },
  })

  try {
    await deleteFile(url)

    logger.info("Video deleted from Blob Storage successfully", {
      context: { url },
    })

    return {
      success: true,
      message: "Video deleted successfully",
    }
  } catch (error: any) {
    logger.error("Failed to delete video from Blob Storage", {
      code: ErrorCodes.STORAGE.DELETE_FAILED,
      details: error,
    })

    return {
      success: false,
      message: error.message || "Unknown error during video deletion",
    }
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
  logger.debug("Testing Blob Storage connection")

  try {
    // Check if the BLOB_READ_WRITE_TOKEN environment variable is set
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return {
        success: false,
        message: "Blob Storage token not configured",
        details: {
          configured: false,
          error: "Missing BLOB_READ_WRITE_TOKEN environment variable",
        },
      }
    }

    // Create a small test buffer
    const testBuffer = Buffer.from("Blob Storage Test " + Date.now())
    const testFilename = `test/blob-test-${Date.now()}.txt`

    // Try to upload the test file
    const url = await uploadToBlob(testBuffer, testFilename)

    if (!url) {
      throw new Error("Failed to upload test file to Blob Storage")
    }

    // Try to delete the test file
    await deleteFile(url)

    logger.info("Blob Storage test completed successfully", {
      context: { testFilename, url },
    })

    return {
      success: true,
      message: "Blob Storage is operational",
      details: {
        configured: true,
        testFile: testFilename,
        testResult: "Success",
      },
    }
  } catch (error: any) {
    logger.error("Blob Storage test failed", {
      code: ErrorCodes.STORAGE.TEST_FAILED,
      details: error,
    })

    return {
      success: false,
      message: `Blob Storage test failed: ${error.message}`,
      details: {
        configured: true,
        error: error.message,
        stack: error.stack,
      },
    }
  }
}
