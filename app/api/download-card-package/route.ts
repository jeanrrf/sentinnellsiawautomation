import { type NextRequest, NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"
import fs from "fs"
import path from "path"
import { uploadToBlob } from "@/lib/blob-storage"

const logger = createLogger("API:DownloadCardPackage")

export async function POST(request: NextRequest) {
  try {
    const { productId, cardImageUrl, description } = await request.json()

    if (!productId || !cardImageUrl) {
      logger.warn("Missing required parameters")
      return NextResponse.json(
        { success: false, message: "Product ID and card image URL are required" },
        { status: 400 },
      )
    }

    logger.info("Processing download package request", { productId })

    // Create a temporary directory for the files
    const tempDir = path.join(process.cwd(), "tmp")
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    // Generate unique filenames
    const timestamp = Date.now()
    const cardFilename = `produto-${productId}-${timestamp}.png`
    const descFilename = `descricao-produto-${productId}-${timestamp}.txt`

    // Save the description to a file
    let descriptionPath = null
    if (description) {
      descriptionPath = path.join(tempDir, descFilename)
      fs.writeFileSync(descriptionPath, description)
      logger.info("Description file created", { path: descriptionPath })
    }

    // For the card image, we need to fetch it if it's a URL
    let cardImagePath = null
    if (cardImageUrl.startsWith("http")) {
      // Fetch the image
      const response = await fetch(cardImageUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`)
      }

      const imageBuffer = await response.arrayBuffer()
      cardImagePath = path.join(tempDir, cardFilename)
      fs.writeFileSync(cardImagePath, Buffer.from(imageBuffer))
      logger.info("Card image fetched and saved", { path: cardImagePath })
    } else if (cardImageUrl.startsWith("data:")) {
      // Handle data URL
      const base64Data = cardImageUrl.split(",")[1]
      const imageBuffer = Buffer.from(base64Data, "base64")
      cardImagePath = path.join(tempDir, cardFilename)
      fs.writeFileSync(cardImagePath, imageBuffer)
      logger.info("Card image from data URL saved", { path: cardImagePath })
    } else {
      // Assume it's a local path
      cardImagePath = cardImageUrl
      logger.info("Using local card image path", { path: cardImagePath })
    }

    // Upload files to Blob storage if available
    let cardBlobUrl = null
    let descBlobUrl = null

    try {
      if (cardImagePath && fs.existsSync(cardImagePath)) {
        cardBlobUrl = await uploadToBlob(fs.readFileSync(cardImagePath), cardFilename, "image/png")
        logger.info("Card image uploaded to Blob storage", { url: cardBlobUrl })
      }

      if (descriptionPath && fs.existsSync(descriptionPath)) {
        descBlobUrl = await uploadToBlob(fs.readFileSync(descriptionPath), descFilename, "text/plain")
        logger.info("Description uploaded to Blob storage", { url: descBlobUrl })
      }
    } catch (error) {
      logger.warn("Failed to upload to Blob storage, continuing with local files", { error })
    }

    // Return the file paths and blob URLs
    return NextResponse.json({
      success: true,
      files: {
        card: {
          path: cardImagePath,
          blobUrl: cardBlobUrl,
          filename: cardFilename,
        },
        description: descriptionPath
          ? {
              path: descriptionPath,
              blobUrl: descBlobUrl,
              filename: descFilename,
            }
          : null,
      },
    })
  } catch (error) {
    logger.error("Error processing download package", { error })
    return NextResponse.json(
      { success: false, message: "Error processing download package", error: error.message },
      { status: 500 },
    )
  }
}
