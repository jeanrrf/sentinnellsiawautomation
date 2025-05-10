import { put, del } from "@vercel/blob"
import { createLogger, ErrorCodes } from "./logger"

const logger = createLogger("BlobStorage")

// Function to upload a video to Vercel Blob Storage
export async function uploadVideo(buffer: Buffer, filename: string): Promise<string | null> {
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
  } catch (error) {
    logger.error("Failed to upload to Blob Storage", {
      code: ErrorCodes.STORAGE.BLOB_UPLOAD_FAILED,
      details: error,
    })
    return null
  }
}

// Function to upload a video to Vercel Blob Storage
export async function uploadVideoToBlob(
  buffer: Buffer,
  productId: string,
): Promise<{ success: boolean; url?: string; filename?: string; error?: string }> {
  const filename = `produto_${productId}_${Date.now()}.mp4`
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

    return { success: true, url: blob.url, filename: filename }
  } catch (error: any) {
    logger.error("Failed to upload to Blob Storage", {
      code: ErrorCodes.STORAGE.BLOB_UPLOAD_FAILED,
      details: error,
    })
    return { success: false, error: error.message }
  }
}

// Function to delete a video from Vercel Blob Storage
export async function deleteVideo(url: string): Promise<void> {
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
