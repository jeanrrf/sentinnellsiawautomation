import { NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"

const logger = createLogger("blob-status-api")

export async function GET() {
  try {
    // In a real implementation, you would check Blob storage metrics
    // For now, we'll return mock data

    const blobStatus = {
      connected: true,
      storage: {
        used: Math.floor(Math.random() * 500),
        total: 1024,
        percentage: Math.floor(Math.random() * 50),
      },
      files: {
        total: 100 + Math.floor(Math.random() * 100),
        images: 70 + Math.floor(Math.random() * 50),
        videos: 10 + Math.floor(Math.random() * 30),
        other: 5 + Math.floor(Math.random() * 20),
      },
      recentUploads: Math.floor(Math.random() * 20),
    }

    return NextResponse.json(blobStatus)
  } catch (error: any) {
    logger.error("Error fetching blob status:", error)

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch blob storage status",
      },
      { status: 500 },
    )
  }
}
