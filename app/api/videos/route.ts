import { NextResponse } from "next/server"
import redis from "@/lib/redis"

export async function GET() {
  try {
    // Get all video IDs from the set
    const videoIds = await redis.smembers("shopee:videos")

    if (!videoIds || videoIds.length === 0) {
      return NextResponse.json({
        success: true,
        videos: [],
      })
    }

    // Fetch each video's data
    const videos = []
    for (const videoId of videoIds) {
      const videoData = await redis.get(`shopee:video:${videoId}`)
      if (videoData) {
        try {
          videos.push(JSON.parse(videoData))
        } catch (e) {
          console.error(`Error parsing video data for ${videoId}:`, e)
        }
      }
    }

    return NextResponse.json({
      success: true,
      videos,
    })
  } catch (error: any) {
    console.error("Error fetching videos:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Failed to fetch videos: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
