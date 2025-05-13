import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { createLogger } from "@/lib/logger"

const logger = createLogger("API:DownloadVideo")

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const filePath = url.searchParams.get("path")

    if (!filePath) {
      logger.warn("Missing file path")
      return NextResponse.json({ success: false, message: "File path is required" }, { status: 400 })
    }

    // Verify if we're in Vercel
    const isVercel = process.env.VERCEL === "1"

    if (isVercel) {
      logger.info("Running in Vercel environment, returning simulated data")
      // In Vercel, we can't access the file system directly
      // We would need to use Blob Storage or similar
      return NextResponse.json(
        {
          success: false,
          message: "Download not available in production environment",
        },
        { status: 400 },
      )
    }

    // In development, try to access the file system
    try {
      // Security check: ensure the file is within the project directory
      const normalizedPath = path.normalize(filePath)
      const projectRoot = process.cwd()

      if (!normalizedPath.startsWith(projectRoot)) {
        logger.warn("Attempted to access file outside project directory", { normalizedPath })
        return NextResponse.json(
          {
            success: false,
            message: "Access denied: file is outside project directory",
          },
          { status: 403 },
        )
      }

      if (!fs.existsSync(normalizedPath)) {
        logger.warn("File not found", { normalizedPath })
        return NextResponse.json({ success: false, message: "File not found" }, { status: 404 })
      }

      const fileBuffer = fs.readFileSync(normalizedPath)
      const fileName = path.basename(normalizedPath)

      logger.info("Serving file for download", { fileName, size: fileBuffer.length })

      return new Response(fileBuffer, {
        headers: {
          "Content-Type": "video/mp4",
          "Content-Disposition": `attachment; filename="${fileName}"`,
        },
      })
    } catch (fsError) {
      logger.error("Error accessing file system:", fsError)
      return NextResponse.json(
        {
          success: false,
          message: "Error accessing file",
          error: fsError.message,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    logger.error("Error downloading video:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to download video",
        error: error.message || "Unknown error",
      },
      { status: 500 },
    )
  }
}
